// api/dl.js
// Menggunakan modul crypto bawaan Node.js
const { webcrypto } = require('node:crypto');
if (!globalThis.crypto) globalThis.crypto = webcrypto;

class ytdl {
    constructor() {
        this.base = 'https://';
        this.hr = {
            'content-type': 'application/json',
            'referer': this.base + '#/jy/',
            'user-agent': 'Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0'
        };
        this.p = [121, 50, 109, 97, 116, 101, 101, 46, 99, 111];
        this.format = { "mp3": "0", "mp4": "1" };
        this.b();
    }
    b() {
        let k = String.fromCharCode(...this.p)
        this.base += 'api.' + k;
        this.hr.referer.replace('#', k)
    }
    ranHash() {
        const x = new Uint8Array(0x10);
        crypto.getRandomValues(x);
        return Array.from(x, y => y.toString(0x10).padStart(0x2, '0')).join('');
    }
    encUrl(u) {
        return u.split('').map(c => c.charCodeAt(0)).reverse().join(',');
    }
    encodeDecode(a0) {
        let a1 = '';
        for (var a2 = 0x0; a2 < a0.length; a2++) {
            a1 += String.fromCharCode(a0.charCodeAt(a2) ^ 0x1);
        }
        return a1;
    }
    isUrlValid(url) {
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(embed\/|v\/|watch\?v=|watch\?.+&v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const shortsRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
        return ytRegex.test(url) || shortsRegex.test(url);
    };

    async init(url, format) {
        if (!this.isUrlValid(url)) {
            return { status: false, msg: "Invalid YouTube video URL" }
        }
        let p1 = this.ranHash(), p2 = this.ranHash(), c = this.encUrl(url)
        try {
            const response = await fetch(`${this.base}/${p1}/init/${c}/${p2}/`, {
                method: 'POST',
                headers: this.hr,
                body: JSON.stringify({ data: this.encodeDecode(url), format, referer: this.hr.referer })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            throw new Error(`Error initiating conversion: ${error.message}`);
        }
    };
    async check(id) {
        let p1 = this.ranHash(), p2 = this.ranHash();
        try {
            const response = await fetch(`${this.base}/${p1}/status/${id}/${p2}/`, {
                method: 'POST',
                headers: this.hr,
                body: JSON.stringify({ data: id })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            throw new Error(`Error checking conversion status: ${error.message}`);
        }
    };
    async process(url, type) {
        try {
            const sl = this.format[type]
            if (!sl) return { status: false, msg: "Formats not found", list: Object.keys(this.format) };
            const init = await this.init(url, sl);
            if (init.le) {
                return { status: false, msg: "Video is too long (>30 minute)." }
            }
            if (init.e) {
                return { status: false, msg: init.msg ? init.msg : "An error occurred during initiation" }
            }
            let status = init, cached = 0;
            while (status.s !== 'C' && status.e !== true) {
                // Delay 2 detik agar tidak spam request
                await new Promise(resolve => setTimeout(resolve, 2000));
                status = await this.check(init.i);
                ++cached;
                if (cached > 15) break; // Timeout guard
            }
            if (status.s === 'C') {
                let p1 = this.ranHash(), p2 = this.ranHash();
                return { status: true, cached: !cached, type: type, title: status.t, dl: `${this.base}/${p1}/download/${status.i}/${p2}/` };
            } else {
                return { status: false, data: status, msg: "Timeout or Conversion Failed" };
            }
        } catch (error) {
            return { status: false, msg: error.message };
        };
    }
}

// Vercel Serverless Function Handler
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url, type } = req.body;

    if (!url || !type) {
        return res.status(400).json({ error: 'URL and Type (mp3/mp4) are required' });
    }

    try {
        const downloader = new ytdl();
        const result = await downloader.process(url, type);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
}

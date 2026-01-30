// api/dl.js
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
        if (!this.isUrlValid(url)) throw new Error("Invalid YouTube URL");
        let p1 = this.ranHash(), p2 = this.ranHash(), c = this.encUrl(url)
        try {
            const response = await fetch(`${this.base}/${p1}/init/${c}/${p2}/`, {
                method: 'POST',
                headers: this.hr,
                body: JSON.stringify({ data: this.encodeDecode(url), format, referer: this.hr.referer })
            });
            return await response.json();
        } catch (error) { throw new Error(error.message); }
    };
    async check(id) {
        let p1 = this.ranHash(), p2 = this.ranHash();
        try {
            const response = await fetch(`${this.base}/${p1}/status/${id}/${p2}/`, {
                method: 'POST',
                headers: this.hr,
                body: JSON.stringify({ data: id })
            });
            return await response.json();
        } catch (error) { throw new Error(error.message); }
    };
    async process(url, type) {
        try {
            const sl = this.format[type]
            if (!sl) return { status: false, msg: "Formats not found" };
            const init = await this.init(url, sl);
            if (init.le) return { status: false, msg: "Video too long (>30 min)" };
            if (init.e) return { status: false, msg: init.msg || "Error initiation" };
            
            let status = init, cached = 0;
            while (status.s !== 'C' && status.e !== true) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                status = await this.check(init.i);
                if (++cached > 20) break; 
            }
            if (status.s === 'C') {
                let p1 = this.ranHash(), p2 = this.ranHash();
                return { status: true, type: type, title: status.t, dl: `${this.base}/${p1}/download/${status.i}/${p2}/` };
            } else {
                return { status: false, msg: "Timeout/Failed" };
            }
        } catch (error) { return { status: false, msg: error.message }; };
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { url, type } = req.body;
    if (!url) return res.status(400).json({ error: 'URL Missing' });

    try {
        const dl = new ytdl();
        const result = await dl.process(url, type || 'mp3');
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
}

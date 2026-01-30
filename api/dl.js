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
        this.p = [121, 50, 109, 97, 116, 101, 101, 46, 99, 111]; // y2mate
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
        // Validasi dasar URL YouTube
        return (url.includes('youtube.com/') || url.includes('youtu.be/'));
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
        } catch (error) { throw new Error("Source Init Failed: " + error.message); }
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
        } catch (error) { throw new Error("Check Status Failed"); }
    };
    async process(url, type) {
        try {
            const sl = this.format[type]
            if (!sl) return { status: false, msg: "Format invalid" };
            
            const init = await this.init(url, sl);
            if (init.le) return { status: false, msg: "Video too long (>30 min)" };
            if (init.e) return { status: false, msg: init.msg || "Error initiation" };
            
            let status = init, cached = 0;
            // Loop menunggu konversi selesai
            while (status.s !== 'C' && status.e !== true) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                status = await this.check(init.i);
                if (++cached > 20) break; // Timeout setelah 40 detik
            }
            
            if (status.s === 'C') {
                let p1 = this.ranHash(), p2 = this.ranHash();
                return { 
                    status: true, 
                    type: type, 
                    title: status.t, 
                    dl: `${this.base}/${p1}/download/${status.i}/${p2}/` 
                };
            } else {
                return { status: false, msg: "Timeout/Failed to convert" };
            }
        } catch (error) { return { status: false, msg: error.message }; };
    }
}

// HANDLER VERCEL
module.exports = async (req, res) => {
    // CORS Headers Lengkap
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle Preflight Request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Pastikan request method POST
    if (req.method !== 'POST') {
        return res.status(405).json({ status: false, msg: 'Method Not Allowed' });
    }

    try {
        const { url, type } = req.body;
        
        if (!url) {
            return res.status(400).json({ status: false, msg: 'URL Missing' });
        }

        const dl = new ytdl();
        const result = await dl.process(url, type || 'mp3');
        
        res.status(200).json(result);
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ status: false, msg: "Internal Server Error: " + error.message });
    }
};

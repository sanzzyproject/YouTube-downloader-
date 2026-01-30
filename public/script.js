async function processVideo() {
    const urlInput = document.getElementById('urlInput');
    const btn = document.getElementById('downloadBtn');
    const statusText = document.getElementById('statusText');
    const resultArea = document.getElementById('resultArea');
    const loader = document.getElementById('loader');
    const resultContent = document.getElementById('resultContent');
    
    // Reset UI
    resultArea.classList.add('hidden');
    resultContent.classList.add('hidden');
    statusText.innerText = "";
    
    const url = urlInput.value.trim();
    // Ambil format, default mp3 jika error
    let type = 'mp3';
    try {
        type = document.querySelector('input[name="format"]:checked').value;
    } catch(e) {}

    if (!url) {
        alert("Please paste a YouTube link!");
        return;
    }

    // Loading State
    btn.disabled = true;
    btn.innerHTML = `<div class="loader" style="width:15px;height:15px;border-width:2px;display:inline-block;margin-bottom:0"></div> Processing...`;
    
    resultArea.classList.remove('hidden');
    loader.classList.remove('hidden');
    statusText.innerText = "Connecting to server...";
    statusText.style.color = "#b3b3b3";

    try {
        // Fetch ke API
        const response = await fetch('/api/dl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, type })
        });

        // Cek Content Type untuk menghindari error JSON parse pada HTML (404/500)
        const contentType = response.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
            // Jika server mengembalikan HTML (Error page), kita baca text-nya
            const text = await response.text();
            console.error("Server Response (Not JSON):", text);
            throw new Error("Server Error (API Route Not Found or Crash). Check Console.");
        }

        const data = await response.json();
        loader.classList.add('hidden');

        if (data.status) {
            resultContent.classList.remove('hidden');
            document.getElementById('videoTitle').innerText = data.title || "Download Ready";
            document.getElementById('dlButton').href = data.dl;
            statusText.innerText = "Success!";
            statusText.style.color = "#00ff00";
        } else {
            statusText.innerText = data.msg || "Failed to convert.";
            statusText.style.color = "red";
        }
    } catch (error) {
        console.error(error);
        loader.classList.add('hidden');
        statusText.innerText = "Error: " + error.message;
        statusText.style.color = "red";
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-bolt"></i> Download Now`;
    }
}

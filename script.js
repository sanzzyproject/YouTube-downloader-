async function processVideo() {
    const urlInput = document.getElementById('urlInput');
    const btn = document.getElementById('downloadBtn');
    const statusText = document.getElementById('statusText');
    const resultArea = document.getElementById('resultArea');
    const loader = document.getElementById('loader');
    const resultContent = document.getElementById('resultContent');
    
    // Reset
    resultArea.classList.add('hidden');
    resultContent.classList.add('hidden');
    statusText.innerText = "";
    
    const url = urlInput.value.trim();
    const type = document.querySelector('input[name="format"]:checked').value;

    if (!url) {
        alert("Please paste a valid YouTube link first!");
        return;
    }

    // UI Loading
    btn.disabled = true;
    btn.innerHTML = `<div class="loader" style="width:15px;height:15px;border-width:2px;display:inline-block;margin-bottom:0"></div> Processing...`;
    
    resultArea.classList.remove('hidden');
    loader.classList.remove('hidden');
    statusText.innerText = "Connecting to server...";
    statusText.style.color = "#b3b3b3";

    try {
        const response = await fetch('/api/dl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, type })
        });

        // Cek jika response HTML (Error yang kamu alami)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
            throw new Error("Server Misconfiguration: Backend API not found. Please deploy to Vercel correctly.");
        }

        const data = await response.json();

        loader.classList.add('hidden');

        if (data.status) {
            resultContent.classList.remove('hidden');
            document.getElementById('videoTitle').innerText = data.title;
            document.getElementById('dlButton').href = data.dl;
            statusText.innerText = "Ready to download!";
            statusText.style.color = "#00ff00";
        } else {
            statusText.innerText = data.msg || "Failed to convert.";
            statusText.style.color = "red";
        }
    } catch (error) {
        console.error(error);
        loader.classList.add('hidden');
        statusText.innerText = error.message;
        statusText.style.color = "red";
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-bolt"></i> Download Now`;
    }
}

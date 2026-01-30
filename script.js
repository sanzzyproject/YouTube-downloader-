async function processVideo() {
    const urlInput = document.getElementById('urlInput');
    const statusBox = document.getElementById('status');
    const resultBox = document.getElementById('result');
    const statusText = document.getElementById('statusText');
    const convertBtn = document.getElementById('convertBtn');
    
    // Reset UI
    resultBox.classList.add('hidden');
    statusBox.classList.add('hidden');
    
    const url = urlInput.value.trim();
    const type = document.querySelector('input[name="format"]:checked').value;

    if (!url) {
        alert("Please enter a YouTube URL");
        return;
    }

    // UI Loading State
    convertBtn.disabled = true;
    convertBtn.innerText = "PROCESSING...";
    statusBox.classList.remove('hidden');
    statusText.innerText = "Initializing connection...";

    try {
        // Panggil API Backend (Vercel Function)
        const response = await fetch('/api/dl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, type })
        });

        const data = await response.json();

        if (data.status) {
            statusBox.classList.add('hidden');
            resultBox.classList.remove('hidden');
            
            document.getElementById('videoTitle').innerText = data.title || "Unknown Title";
            document.getElementById('downloadLink').href = data.dl;
        } else {
            statusText.innerText = "Error: " + (data.msg || "Failed to convert");
            statusText.style.color = "red";
        }

    } catch (error) {
        console.error(error);
        statusText.innerText = "Server Error. Check console.";
        statusText.style.color = "red";
    } finally {
        convertBtn.disabled = false;
        convertBtn.innerText = "CONVERT";
    }
}

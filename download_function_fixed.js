async function download_vids() {
    // Create downloads directory if it doesn't exist
    const downloadDir = 'C:\\Users\\HP\\Documents\\src\\twitter-stuff\\downloads';
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
        console.log(`Created directory: ${downloadDir}`);
    }

    for (const video of allVideoUrls) {
        const url = video.url;
        const filename = `video_${video.video}_${video.quality}.mp4`;
        const outputPath = path.join(downloadDir, filename);

        // Skip if file already exists
        if (fs.existsSync(outputPath)) {
            console.log(`Skipping ${filename} (already exists)`);
            continue;
        }

        try {
            console.log(`Downloading ${filename} from ${url}...`);
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            console.log(`Status: ${response.status}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
            console.log(`Successfully downloaded ${filename}`);
            
            // Small delay to be respectful
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`Error downloading ${filename}:`, error);
        }
    }
    console.log('\nAll video downloads attempted.');
}
// Multi-User Twitter Video Extraction and Download Script
// Automatically processes multiple users and downloads their videos in parallel
// Supports local storage + Google Cloud Storage backup

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Storage } from '@google-cloud/storage';
import { Buffer } from 'node:buffer';

// 🎯 USER CONFIGURATION - Add your request file names here
const USER_FILES = [
    'request_twitter.js',    // Tee Forever
    'request_yoshi.js',      // Yoshi
    'request_ladycake.js'    // Ladycake
];

// ☁️ GOOGLE CLOUD STORAGE CONFIGURATION
const GCS_BUCKET_NAME = 'twitter-scrape122'; // 🔧 CHANGE THIS TO YOUR BUCKET NAME
const ENABLE_GCS_UPLOAD = true; // Set to false to disable GCS uploads
const GCS_FOLDER_PREFIX = 'twitter-videos'; // Folder structure in GCS: twitter-videos/username/

// Initialize GCS client (uses service account from environment or metadata)
let gcsStorage = null;
let gcsBucket = null;

if (ENABLE_GCS_UPLOAD) {
    try {
        gcsStorage = new Storage();
        gcsBucket = gcsStorage.bucket(GCS_BUCKET_NAME);
        console.log(`☁️  GCS initialized for bucket: ${GCS_BUCKET_NAME}`);
        
        // Test GCS permissions
        console.log(`🔍 Testing GCS permissions...`);
        gcsBucket.exists().then(([exists]) => {
            if (exists) {
                console.log(`✅ GCS bucket access confirmed`);
            } else {
                console.log(`⚠️  GCS bucket '${GCS_BUCKET_NAME}' not found or no access`);
            }
        }).catch(error => {
            console.log(`⚠️  GCS permission test failed: ${error.message}`);
            console.log(`💡 To fix GCS permissions on VM:`);
            console.log(`   1. Stop VM: gcloud compute instances stop YOUR_VM_NAME`);
            console.log(`   2. Add storage scope: gcloud compute instances set-service-account YOUR_VM_NAME --scopes=https://www.googleapis.com/auth/cloud-platform`);
            console.log(`   3. Start VM: gcloud compute instances start YOUR_VM_NAME`);
            console.log(`   4. Or create bucket with: gsutil mb gs://${GCS_BUCKET_NAME}`);
        });
    } catch (error) {
        console.error(`❌ Failed to initialize GCS: ${error.message}`);
        console.log(`⚠️  Continuing with local storage only...`);
    }
}

// ☁️ Upload file to Google Cloud Storage
async function uploadToGCS(localFilePath, username, filename) {
    if (!ENABLE_GCS_UPLOAD || !gcsBucket) {
        return { success: false, reason: 'GCS not enabled or initialized' };
    }

    try {
        const gcsPath = `${GCS_FOLDER_PREFIX}/${username}/${filename}`;
        const file = gcsBucket.file(gcsPath);
        
        // Check if file already exists in GCS
        const [exists] = await file.exists();
        if (exists) {
            return { success: true, reason: 'already exists', gcsPath };
        }

        // Upload file to GCS
        await file.save(fs.readFileSync(localFilePath), {
            metadata: {
                contentType: 'video/mp4',
                metadata: {
                    username: username,
                    uploadedAt: new Date().toISOString(),
                    source: 'twitter-video-downloader'
                }
            }
        });

        return { success: true, reason: 'uploaded', gcsPath };
    } catch (error) {
        return { success: false, reason: error.message };
    }
}
let globalStats = {
    totalUsers: 0,
    totalVideosFound: 0,
    totalVideosDownloaded: 0,
    totalVideosFailed: 0,
    totalVideosSkipped: 0,
    totalSizeDownloaded: 0,
    totalGcsUploaded: 0,
    totalGcsFailed: 0,
    userResults: []
};

// 🎯 Extract username from request file for folder naming
function extractUsername(filename) {
    const baseName = filename.replace('.js', '').replace('request_', '');
    return baseName;
}

// 🎬 Extract videos from API response data
function extractVideos(data, username) {
    const allVideoUrls = [];
    let videoCount = 0;

    function findVideos(obj) {
        if (typeof obj !== 'object' || obj === null) return;
        
        if (obj.video_info && obj.video_info.variants) {
            videoCount++;
            console.log(`   📹 Found video ${videoCount} for ${username}`);
            
            // Get MP4 variants sorted by quality (highest bitrate first)
            const mp4Variants = obj.video_info.variants
                .filter(v => v.content_type === 'video/mp4')
                .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                
            mp4Variants.forEach((variant, i) => {
                const quality = variant.bitrate >= 5000000 ? '1080p' : 
                               variant.bitrate >= 2000000 ? '720p' : 
                               variant.bitrate >= 900000 ? '480p' : '320p';
                
                allVideoUrls.push({
                    video: videoCount,
                    quality: quality,
                    bitrate: variant.bitrate,
                    url: variant.url,
                    username: username
                });
            });
        }
        
        // Recursively search all properties
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                findVideos(obj[key]);
            }
        }
    }

    findVideos(data);
    return { allVideoUrls, videoCount };
}

// 📥 Smart download function with progress tracking
async function downloadUserVideos(allVideoUrls, username) {
    const downloadDir = path.join('downloads', username);
    
    // Create user-specific download directory
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
        console.log(`   📁 Created directory: ${downloadDir}`);
    }

    // Get list of existing files for this user
    const existingFiles = fs.existsSync(downloadDir) ? fs.readdirSync(downloadDir) : [];
    
    // Create a set of existing video IDs for quick lookup
    const existingVideoIds = new Set();
    existingFiles.forEach(file => {
        const match = file.match(/^video_(\d+)_/);
        if (match) {
            existingVideoIds.add(match[1]);
        }
    });

    // Smart duplicate detection and best quality selection
    const videosToDownload = allVideoUrls.filter(video => {
        const filename = `video_${video.video}_${video.quality}.mp4`;
        const outputPath = path.join(downloadDir, filename);
        
        // Check 1: Exact file exists
        if (fs.existsSync(outputPath)) {
            return false;
        }
        
        // Check 2: Same video ID exists in any quality
        if (existingVideoIds.has(video.video.toString())) {
            return false;
        }
        
        return true;
    });

    // Group by video ID and select best quality
    const videoGroups = {};
    videosToDownload.forEach(video => {
        const videoId = video.video;
        if (!videoGroups[videoId]) {
            videoGroups[videoId] = [];
        }
        videoGroups[videoId].push(video);
    });

    const uniqueVideosToDownload = [];
    Object.values(videoGroups).forEach(group => {
        const bestQuality = group.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        uniqueVideosToDownload.push(bestQuality);
    });

    const skippedCount = allVideoUrls.length - uniqueVideosToDownload.length;
    
    console.log(`   🎯 ${username}: ${uniqueVideosToDownload.length} new videos to download, ${skippedCount} skipped`);

    if (uniqueVideosToDownload.length === 0) {
        return { successCount: 0, errorCount: 0, skipped: skippedCount, totalSizeMB: 0 };
    }

    // Download function with progress and GCS upload
    async function downloadSingleVideo(video, index, total) {
        const url = video.url;
        const filename = `video_${video.video}_${video.quality}.mp4`;
        const outputPath = path.join(downloadDir, filename);

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentLength = response.headers.get('content-length');
            const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

            let downloadedBytes = 0;
            const chunks = [];
            const reader = response.body.getReader();
            const startTime = Date.now();
            let lastProgressUpdate = 0;

            // Download with progress tracking
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                downloadedBytes += value.length;

                // Update progress every 1000ms
                const now = Date.now();
                if (totalBytes > 0 && (now - lastProgressUpdate > 1000 || done)) {
                    const progress = (downloadedBytes / totalBytes * 100).toFixed(1);
                    const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(1);
                    const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
                    const speed = downloadedBytes / ((now - startTime) / 1000) / 1024; // KB/s
                    
                    const barLength = 15;
                    const filled = Math.floor((downloadedBytes / totalBytes) * barLength);
                    const progressBar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
                    
                    process.stdout.write(`\r   ⬇️  [${index + 1}/${total}] ${username}: [${progressBar}] ${progress}% (${downloadedMB}/${totalMB}MB) ${speed.toFixed(0)}KB/s`);
                    lastProgressUpdate = now;
                }
            }

            // Combine chunks and save locally
            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const finalBuffer = new Uint8Array(totalLength);
            let position = 0;
            for (const chunk of chunks) {
                finalBuffer.set(chunk, position);
                position += chunk.length;
            }

            fs.writeFileSync(outputPath, Buffer.from(finalBuffer));
            
            const fileSizeMB = (finalBuffer.length / 1024 / 1024).toFixed(2);
            const downloadDuration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Clear progress line
            process.stdout.write('\r' + ' '.repeat(100) + '\r');
            console.log(`   ✅ [${index + 1}/${total}] ${username}: ${filename} (${fileSizeMB}MB in ${downloadDuration}s)`);
            console.log(`   📁 Local path: ${outputPath}`);
            
            // Upload to GCS
            let gcsResult = { success: false, reason: 'disabled' };
            if (ENABLE_GCS_UPLOAD) {
                console.log(`   ☁️  [${index + 1}/${total}] ${username}: Uploading ${filename} to GCS...`);
                const uploadStartTime = Date.now();
                gcsResult = await uploadToGCS(outputPath, username, filename);
                const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
                
                if (gcsResult.success) {
                    if (gcsResult.reason === 'uploaded') {
                        console.log(`   ☁️  [${index + 1}/${total}] ${username}: ✅ Uploaded to GCS: ${gcsResult.gcsPath} (${uploadDuration}s)`);
                    } else {
                        console.log(`   ☁️  [${index + 1}/${total}] ${username}: ⏭️  Already exists in GCS: ${gcsResult.gcsPath}`);
                    }
                } else {
                    // Clean up the error message for better readability
                    let errorMsg = gcsResult.reason;
                    if (errorMsg.includes('Provided scope(s) are not authorized')) {
                        errorMsg = 'GCS Permission Error: VM service account needs Cloud Storage permissions';
                    } else if (errorMsg.includes('code')) {
                        try {
                            const errorObj = JSON.parse(errorMsg);
                            errorMsg = `${errorObj.error?.code || 'Unknown'}: ${errorObj.error?.message || errorMsg}`;
                        } catch {
                            // Keep original message if it's not JSON
                        }
                    }
                    console.log(`   ☁️  [${index + 1}/${total}] ${username}: ❌ GCS upload failed: ${errorMsg}`);
                }
            }
            
            return { 
                success: true, 
                filename, 
                size: parseFloat(fileSizeMB), 
                quality: video.quality,
                gcsUploaded: gcsResult.success,
                gcsPath: gcsResult.gcsPath || null,
                gcsReason: gcsResult.reason
            };

        } catch (error) {
            process.stdout.write('\r' + ' '.repeat(100) + '\r');
            console.error(`   ❌ [${index + 1}/${total}] ${username}: ${filename} - ${error.message}`);
            return { success: false, filename, error: error.message };
        }
    }

    // Process downloads with controlled concurrency
    const CONCURRENT_DOWNLOADS = 2; // Lower for multi-user to be respectful
    const results = [];
    let completedDownloads = 0;

    for (let i = 0; i < uniqueVideosToDownload.length; i += CONCURRENT_DOWNLOADS) {
        const batch = uniqueVideosToDownload.slice(i, i + CONCURRENT_DOWNLOADS);
        
        const batchPromises = batch.map(async (video, batchIndex) => {
            const result = await downloadSingleVideo(video, i + batchIndex, uniqueVideosToDownload.length);
            completedDownloads++;
            return result;
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                results.push({ success: false, filename: 'unknown', error: 'Promise rejected' });
            }
        });

        // Small delay between batches
        if (i + CONCURRENT_DOWNLOADS < uniqueVideosToDownload.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    // Calculate results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const totalSizeMB = successful.reduce((sum, r) => sum + (r.size || 0), 0);
    const gcsUploaded = successful.filter(r => r.gcsUploaded).length;
    const gcsFailed = successful.filter(r => !r.gcsUploaded && ENABLE_GCS_UPLOAD).length;

    return { 
        successCount: successful.length, 
        errorCount: failed.length, 
        skipped: skippedCount,
        totalSizeMB,
        gcsUploaded,
        gcsFailed
    };
}

// 🚀 Process a single user
async function processUser(userFile) {
    const username = extractUsername(userFile);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 PROCESSING USER: ${username.toUpperCase()}`);
    console.log(`${'='.repeat(60)}`);

    try {
        // Dynamically import the user's request function
        console.log(`📡 Loading request function from ${userFile}...`);
        const userModule = await import(`./${userFile}`);
        
        // Get the function name (e.g., request_twitter, request_yoshi)
        const functionName = `request_${username}`;
        const requestFunction = userModule[functionName];
        
        if (!requestFunction) {
            throw new Error(`Function ${functionName} not found in ${userFile}`);
        }

        // Fetch user data
        console.log(`📥 Fetching data for ${username}...`);
        const userData = await requestFunction();
        
        // Extract videos
        console.log(`🎬 Extracting videos for ${username}...`);
        const { allVideoUrls, videoCount } = extractVideos(userData, username);
        
        console.log(`📊 Found ${videoCount} unique videos with ${allVideoUrls.length} total quality variants`);
        
        // Download videos
        console.log(`📥 Starting downloads for ${username}...`);
        const downloadResult = await downloadUserVideos(allVideoUrls, username);
        
        // Update global stats
        globalStats.totalVideosFound += videoCount;
        globalStats.totalVideosDownloaded += downloadResult.successCount;
        globalStats.totalVideosFailed += downloadResult.errorCount;
        globalStats.totalVideosSkipped += downloadResult.skipped;
        globalStats.totalSizeDownloaded += downloadResult.totalSizeMB;
        globalStats.totalGcsUploaded += downloadResult.gcsUploaded || 0;
        globalStats.totalGcsFailed += downloadResult.gcsFailed || 0;
        
        const userResult = {
            username,
            videosFound: videoCount,
            downloaded: downloadResult.successCount,
            failed: downloadResult.errorCount,
            skipped: downloadResult.skipped,
            sizeMB: downloadResult.totalSizeMB,
            gcsUploaded: downloadResult.gcsUploaded || 0,
            gcsFailed: downloadResult.gcsFailed || 0
        };
        
        globalStats.userResults.push(userResult);
        
        console.log(`✅ ${username} completed: ${downloadResult.successCount} downloaded, ${downloadResult.errorCount} failed, ${downloadResult.skipped} skipped`);
        
        return userResult;
        
    } catch (error) {
        console.error(`❌ Error processing ${username}: ${error.message}`);
        const userResult = {
            username,
            videosFound: 0,
            downloaded: 0,
            failed: 0,
            skipped: 0,
            sizeMB: 0,
            error: error.message
        };
        globalStats.userResults.push(userResult);
        return userResult;
    }
}

// 🎯 Main execution function
async function processAllUsers() {
    console.log('🌟 MULTI-USER TWITTER VIDEO DOWNLOADER STARTED');
    console.log(`📋 Processing ${USER_FILES.length} users: ${USER_FILES.map(f => extractUsername(f)).join(', ')}`);
    
    globalStats.totalUsers = USER_FILES.length;
    const startTime = Date.now();
    
    // Process each user sequentially to be respectful to Twitter
    for (let i = 0; i < USER_FILES.length; i++) {
        const userFile = USER_FILES[i];
        console.log(`\n🔄 Progress: User ${i + 1}/${USER_FILES.length}`);
        
        await processUser(userFile);
        
        // Wait between users to be respectful
        if (i < USER_FILES.length - 1) {
            console.log(`⏳ Waiting 3 seconds before next user...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    // Final global summary
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('🎉 MULTI-USER DOWNLOAD SUMMARY');
    console.log(`${'='.repeat(80)}`);
    console.log(`👥 Total users processed: ${globalStats.totalUsers}`);
    console.log(`🎬 Total videos found: ${globalStats.totalVideosFound}`);
    console.log(`✅ Total videos downloaded: ${globalStats.totalVideosDownloaded}`);
    console.log(`❌ Total videos failed: ${globalStats.totalVideosFailed}`);
    console.log(`⏭️  Total videos skipped: ${globalStats.totalVideosSkipped}`);
    console.log(`📦 Total size downloaded: ${globalStats.totalSizeDownloaded.toFixed(2)} MB`);
    if (ENABLE_GCS_UPLOAD) {
        console.log(`☁️  Total uploaded to GCS: ${globalStats.totalGcsUploaded}`);
        console.log(`☁️  Total GCS upload failures: ${globalStats.totalGcsFailed}`);
        console.log(`🗂️  GCS bucket: ${GCS_BUCKET_NAME}`);
    } else {
        console.log(`☁️  GCS uploads: Disabled`);
    }
    console.log(`⏱️  Total processing time: ${totalTime} minutes`);
    
    console.log(`\n📊 PER-USER BREAKDOWN:`);
    globalStats.userResults.forEach(user => {
        if (user.error) {
            console.log(`❌ ${user.username}: ERROR - ${user.error}`);
        } else {
            const gcsInfo = ENABLE_GCS_UPLOAD ? ` | GCS: ${user.gcsUploaded}✅ ${user.gcsFailed}❌` : '';
            console.log(`📁 ${user.username}: ${user.downloaded} downloaded, ${user.failed} failed, ${user.skipped} skipped (${user.sizeMB.toFixed(1)}MB)${gcsInfo}`);
        }
    });
    
    console.log(`\n🎯 Process completed successfully!`);
}

// 🚀 Start the multi-user process
console.log('🚀 Starting multi-user video extraction and download...');
processAllUsers().then(() => {
    console.log('\n✨ All users processed successfully!');
}).catch(error => {
    console.error('\n💥 Multi-user process failed:', error);
});
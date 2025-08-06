export default {
	async fetch(request: any, env: any): Promise<Response> {
		const url = new URL(request.url);

		// 添加 CORS 標頭以提升跨域性能
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		// 處理 OPTIONS 請求（CORS 預檢）
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// 設置快取標頭（靜態資源）
		const cacheHeaders = url.pathname.includes("/download/")
			? {
					"Cache-Control": "public, max-age=3600", // 1小時快取
					ETag: `"${Date.now()}"`,
			  }
			: {
					"Cache-Control": "no-cache",
			  };

		// 處理主頁面 - 顯示 R2 檔案列表
		if (request.method === "GET" && url.pathname === "/") {
			try {
				// 列出 R2 bucket 中的所有物件
				const objects = await env.FILES.list();

				// 除錯：輸出到控制台看看返回什麼
				console.log("R2 list result:", objects);
				console.log("Objects array:", objects.objects);
				console.log("Objects length:", objects.objects?.length);

				let tableRows = "";
				if (objects.objects && objects.objects.length > 0) {
					for (const obj of objects.objects) {
						// 格式化檔案大小函數
						const formatFileSize = (bytes) => {
							if (bytes === 0) return "0 B";
							const sizes = ["B", "KB", "MB", "GB", "TB"];
							const i = Math.floor(
								Math.log(bytes) / Math.log(1024)
							);
							return (
								Math.round((bytes / Math.pow(1024, i)) * 100) /
									100 +
								" " +
								sizes[i]
							);
						};

						// 提取原始檔案名稱（移除時間戳前綴）
						const getOriginalFileName = (fullName) => {
							const match = fullName.match(/^\d+_(.+)$/);
							return match ? match[1] : fullName;
						};

						const displayName = getOriginalFileName(obj.key);

						tableRows += `
							<tr>
								<td>
									<div style="font-weight: 500;">${displayName}</div>
									<div style="font-size: 0.8rem; color: #6c757d; margin-top: 2px;">儲存名稱: ${
										obj.key
									}</div>
								</td>
								<td>${formatFileSize(obj.size)}</td>
								<td>${obj.uploaded.toLocaleString("zh-TW")}</td>
								<td>
									<a href="/download/${
										obj.key
									}" target="_blank" class="action-btn download-btn">📥 下載</a>
									<a href="/delete/${obj.key}" 
									   onclick="return confirm('確定要刪除檔案「${displayName}」嗎？')" 
									   class="action-btn delete-btn">🗑️ 刪除</a>
								</td>
							</tr>
						`;
					}
				}

				const html = `
				<!DOCTYPE html>
				<html lang="zh-TW">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>R2 檔案管理系統</title>
					<style>
						* {
							margin: 0;
							padding: 0;
							box-sizing: border-box;
						}
						body {
							font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							min-height: 100vh;
							padding: 20px;
						}
						.container {
							max-width: 1200px;
							margin: 0 auto;
							background: white;
							border-radius: 15px;
							box-shadow: 0 20px 40px rgba(0,0,0,0.1);
							overflow: hidden;
						}
						.header {
							background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
							color: white;
							padding: 30px;
							text-align: center;
						}
						.header h1 {
							font-size: 2.5rem;
							margin-bottom: 10px;
							font-weight: 300;
						}
						.content {
							padding: 30px;
						}
						.stats {
							background: #f8f9fa;
							padding: 15px 25px;
							border-radius: 10px;
							margin-bottom: 25px;
							border-left: 4px solid #4facfe;
						}
						.stats p {
							font-size: 1.1rem;
							color: #6c757d;
							margin: 0;
						}
						.upload-btn {
							display: inline-block;
							background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
							color: white;
							padding: 12px 30px;
							text-decoration: none;
							border-radius: 25px;
							font-weight: 500;
							margin-bottom: 25px;
							transition: transform 0.3s ease, box-shadow 0.3s ease;
							box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);
						}
						.upload-btn:hover {
							transform: translateY(-2px);
							box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4);
						}
						table {
							width: 100%;
							border-collapse: collapse;
							border-radius: 10px;
							overflow: hidden;
							box-shadow: 0 0 20px rgba(0,0,0,0.1);
						}
						th {
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							color: white;
							padding: 20px 15px;
							text-align: left;
							font-weight: 500;
							font-size: 1rem;
						}
						td {
							padding: 15px;
							border-bottom: 1px solid #eee;
							vertical-align: middle;
						}
						tr:nth-child(even) {
							background-color: #f8f9fa;
						}
						tr:hover {
							background-color: #e3f2fd;
							transition: background-color 0.3s ease;
						}
						.action-btn {
							display: inline-block;
							padding: 8px 16px;
							border-radius: 25px;
							text-decoration: none;
							font-size: 0.85rem;
							font-weight: 600;
							margin-right: 8px;
							transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
							box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
							position: relative;
							overflow: hidden;
							text-align: center;
							min-width: 80px;
						}
						.action-btn::before {
							content: '';
							position: absolute;
							top: 0;
							left: -100%;
							width: 100%;
							height: 100%;
							background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
							transition: left 0.5s;
						}
						.action-btn:hover::before {
							left: 100%;
						}
						.download-btn {
							background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%);
							color: white;
							border: 2px solid transparent;
						}
						.download-btn:hover {
							background: linear-gradient(135deg, #138496 0%, #1ea572 100%);
							transform: translateY(-2px);
							box-shadow: 0 6px 20px rgba(23, 162, 184, 0.4);
						}
						.delete-btn {
							background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
							color: white;
							border: 2px solid transparent;
						}
						.delete-btn:hover {
							background: linear-gradient(135deg, #c82333 0%, #e55a00 100%);
							transform: translateY(-2px);
							box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
						}
						.empty-state {
							text-align: center;
							padding: 50px 20px;
							color: #6c757d;
						}
						.empty-state h3 {
							margin-bottom: 15px;
							color: #495057;
						}
						@media (max-width: 768px) {
							body { padding: 10px; }
							.header h1 { font-size: 2rem; }
							.content { padding: 20px; }
							table { font-size: 0.9rem; }
							th, td { padding: 10px 8px; }
						}
					</style>
				</head>
				<body>
					<div class="container">
						<div class="header">
							<h1>📁 R2 檔案管理系統</h1>
							<p>雲端檔案儲存與管理平台</p>
						</div>
						<div class="content">
							<div class="stats">
								<p>📊 總共 <strong>${objects.objects.length}</strong> 個檔案</p>
							</div>
							<a href="/upload" class="upload-btn">📤 上傳新檔案</a>
							${
								objects.objects.length > 0
									? `
							<table>
								<thead>
									<tr>
										<th>📄 檔案名稱</th>
										<th>📦 檔案大小</th>
										<th>⏰ 上傳時間</th>
										<th>⚙️ 操作</th>
									</tr>
								</thead>
								<tbody>
									${tableRows}
								</tbody>
							</table>
							`
									: `
							<div class="empty-state">
								<h3>📭 目前沒有任何檔案</h3>
								<p>點擊上方的「上傳新檔案」按鈕開始上傳您的第一個檔案</p>
							</div>
							`
							}
						</div>
					</div>
				</body>
				</html>
				`;

				return new Response(html, {
					headers: {
						"content-type": "text/html; charset=utf-8",
					},
				});
			} catch (error) {
				return new Response(`錯誤: ${error.message}`, {
					status: 500,
					headers: {
						"content-type": "text/html; charset=utf-8",
					},
				});
			}
		}

		// 處理 /upload 路徑 - 簡單的檔案上傳測試
		if (request.method === "GET" && url.pathname === "/upload") {
			const uploadHtml = `
			<!DOCTYPE html>
			<html lang="zh-TW">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>上傳檔案 - R2 檔案管理系統</title>
				<style>
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}
					body {
						font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						min-height: 100vh;
						padding: 20px;
						display: flex;
						align-items: center;
						justify-content: center;
					}
					.upload-container {
						max-width: 500px;
						width: 100%;
						background: white;
						border-radius: 20px;
						box-shadow: 0 20px 40px rgba(0,0,0,0.1);
						overflow: hidden;
					}
					.header {
						background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
						color: white;
						padding: 30px;
						text-align: center;
					}
					.header h1 {
						font-size: 2rem;
						margin-bottom: 10px;
						font-weight: 300;
					}
					.header p {
						opacity: 0.9;
						font-size: 1rem;
					}
					.content {
						padding: 40px;
					}
					.upload-form {
						text-align: center;
					}
					.file-input-wrapper {
						position: relative;
						margin-bottom: 30px;
					}
					.file-input {
						width: 100%;
						height: 150px;
						border: 3px dashed #ddd;
						border-radius: 15px;
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						cursor: pointer;
						transition: all 0.3s ease;
						background: #f8f9fa;
						position: relative;
						overflow: hidden;
					}
					.file-input:hover {
						border-color: #11998e;
						background: #e8f5e8;
					}
					.file-input.dragover {
						border-color: #38ef7d;
						background: #e8f5e8;
						transform: scale(1.02);
					}
					.file-input input {
						position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						opacity: 0;
						cursor: pointer;
						z-index: 2;
					}
					.file-icon {
						font-size: 3rem;
						margin-bottom: 15px;
						color: #6c757d;
						pointer-events: none;
						z-index: 1;
						position: relative;
					}
					.file-text {
						font-size: 1.1rem;
						color: #495057;
						margin-bottom: 10px;
						pointer-events: none;
						z-index: 1;
						position: relative;
					}
					.file-subtext {
						font-size: 0.9rem;
						color: #6c757d;
						pointer-events: none;
						z-index: 1;
						position: relative;
					}
					.submit-btn {
						background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
						color: white;
						border: none;
						padding: 15px 40px;
						border-radius: 25px;
						font-size: 1.1rem;
						font-weight: 500;
						cursor: pointer;
						transition: all 0.3s ease;
						box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);
						margin-bottom: 20px;
						position: relative;
					}
					.submit-btn:hover {
						transform: translateY(-2px);
						box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4);
					}
					.submit-btn:disabled {
						background: #6c757d;
						cursor: not-allowed;
						transform: none;
						box-shadow: none;
					}
					.submit-btn.uploading {
						background: linear-gradient(135deg, #6c757d 0%, #adb5bd 100%);
						cursor: wait;
					}
					.submit-btn.uploading::after {
						content: '';
						position: absolute;
						top: 50%;
						right: 15px;
						transform: translateY(-50%);
						width: 16px;
						height: 16px;
						border: 2px solid transparent;
						border-top: 2px solid white;
						border-radius: 50%;
						animation: spin 1s linear infinite;
					}
					@keyframes spin {
						0% { transform: translateY(-50%) rotate(0deg); }
						100% { transform: translateY(-50%) rotate(360deg); }
					}
					.back-link {
						display: inline-block;
						color: #6c757d;
						text-decoration: none;
						font-weight: 500;
						padding: 10px 20px;
						border-radius: 20px;
						transition: all 0.3s ease;
					}
					.back-link:hover {
						background: #f8f9fa;
						color: #495057;
					}
					.selected-file {
						margin-top: 15px;
						padding: 15px;
						background: linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%);
						border-radius: 15px;
						display: none;
						border: 2px solid #38ef7d;
						box-shadow: 0 4px 15px rgba(56, 239, 125, 0.2);
						text-align: center;
					}
					.selected-file.show {
						display: block;
					}
					.selected-file p {
						margin: 4px 0;
						font-size: 0.9rem;
						color: #2d5a3d;
					}
					.selected-file strong {
						color: #1a4d2e;
						font-weight: 600;
					}
					.file-info-item {
						background: white;
						padding: 8px 12px;
						border-radius: 6px;
						margin: 3px 0;
						box-shadow: 0 1px 4px rgba(0,0,0,0.1);
						border-left: 3px solid #11998e;
						display: inline-block;
						min-width: 200px;
					}
					@media (max-width: 768px) {
						body { padding: 10px; }
						.content { padding: 30px 20px; }
						.header h1 { font-size: 1.5rem; }
					}
				</style>
			</head>
			<body>
				<div class="upload-container">
					<div class="header">
						<h1>📤 上傳檔案</h1>
						<p>將您的檔案上傳到雲端儲存空間</p>
					</div>
					<div class="content">
						<form class="upload-form" action="/upload" method="post" enctype="multipart/form-data">
							<div class="file-input-wrapper">
								<div class="file-input" id="fileInputArea">
									<input type="file" id="file" name="file" required>
									<div class="file-icon">📁</div>
									<div class="file-text">點擊選擇檔案或拖拽到此處</div>
									<div class="file-subtext">支援所有檔案格式</div>
								</div>
								<div class="selected-file" id="selectedFile">
									<div class="file-info-item">
										<p><strong>📄 已選擇：</strong><span id="fileName"></span></p>
									</div>
									<div class="file-info-item">
										<p><strong>📦 大小：</strong><span id="fileSize"></span></p>
									</div>
								</div>
							</div>
							<button type="submit" class="submit-btn" id="submitBtn" disabled>
								🚀 開始上傳
							</button>
						</form>
						<a href="/" class="back-link">← 返回檔案列表</a>
					</div>
				</div>
				<script>
					const fileInput = document.getElementById('file');
					const fileInputArea = document.getElementById('fileInputArea');
					const selectedFile = document.getElementById('selectedFile');
					const fileName = document.getElementById('fileName');
					const fileSize = document.getElementById('fileSize');
					const submitBtn = document.getElementById('submitBtn');

					function formatFileSize(bytes) {
						if (bytes === 0) return '0 B';
						const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
						const i = Math.floor(Math.log(bytes) / Math.log(1024));
						return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
					}

					fileInput.addEventListener('change', function(e) {
						if (e.target.files.length > 0) {
							const file = e.target.files[0];
							fileName.textContent = file.name;
							fileSize.textContent = formatFileSize(file.size);
							selectedFile.classList.add('show');
							submitBtn.disabled = false;
						}
					});

					// 拖拽功能
					fileInputArea.addEventListener('dragover', function(e) {
						e.preventDefault();
						fileInputArea.classList.add('dragover');
					});

					fileInputArea.addEventListener('dragleave', function(e) {
						e.preventDefault();
						fileInputArea.classList.remove('dragover');
					});

					fileInputArea.addEventListener('drop', function(e) {
						e.preventDefault();
						fileInputArea.classList.remove('dragover');
						const files = e.dataTransfer.files;
						if (files.length > 0) {
							fileInput.files = files;
							const file = files[0];
							fileName.textContent = file.name;
							fileSize.textContent = formatFileSize(file.size);
							selectedFile.classList.add('show');
							submitBtn.disabled = false;
						}
					});

					// 表單提交優化
					document.querySelector('.upload-form').addEventListener('submit', function(e) {
						const submitBtn = document.getElementById('submitBtn');
						submitBtn.classList.add('uploading');
						submitBtn.textContent = '🚀 上傳中...';
						submitBtn.disabled = true;
					});
				</script>
			</body>
			</html>
			`;

			return new Response(uploadHtml, {
				headers: {
					"content-type": "text/html; charset=utf-8",
				},
			});
		}

		// 處理 POST /upload - 處理檔案上傳
		if (request.method === "POST" && url.pathname === "/upload") {
			try {
				const formData = await request.formData();
				const file = formData.get("file");

				if (!file || typeof file === "string") {
					return new Response("請選擇一個檔案", { status: 400 });
				}

				// 生成檔案名稱
				const fileName = `${Date.now()}_${file.name}`;

				// 格式化檔案大小函數
				const formatFileSize = (bytes) => {
					if (bytes === 0) return "0 B";
					const sizes = ["B", "KB", "MB", "GB", "TB"];
					const i = Math.floor(Math.log(bytes) / Math.log(1024));
					return (
						Math.round((bytes / Math.pow(1024, i)) * 100) / 100 +
						" " +
						sizes[i]
					);
				};

				// 上傳到 R2
				await env.FILES.put(fileName, file.stream(), {
					httpMetadata: {
						contentType: file.type,
					},
				});

				return new Response(
					`
				<!DOCTYPE html>
				<html lang="zh-TW">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>上傳成功 - R2 檔案管理系統</title>
					<style>
						* {
							margin: 0;
							padding: 0;
							box-sizing: border-box;
						}
						body {
							font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							min-height: 100vh;
							padding: 20px;
							display: flex;
							align-items: center;
							justify-content: center;
						}
						.success-container {
							max-width: 500px;
							width: 100%;
							background: white;
							border-radius: 20px;
							box-shadow: 0 20px 40px rgba(0,0,0,0.1);
							overflow: hidden;
							text-align: center;
						}
						.header {
							background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
							color: white;
							padding: 40px;
						}
						.success-icon {
							font-size: 4rem;
							margin-bottom: 20px;
							animation: bounce 0.6s ease-in-out;
						}
						@keyframes bounce {
							0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
							40%, 43% { transform: translate3d(0,-15px,0); }
							70% { transform: translate3d(0,-7px,0); }
							90% { transform: translate3d(0,-2px,0); }
						}
						.header h1 {
							font-size: 2rem;
							margin-bottom: 10px;
							font-weight: 300;
						}
						.content {
							padding: 30px;
						}
						.file-info {
							background: #f8f9fa;
							padding: 20px;
							border-radius: 15px;
							margin-bottom: 30px;
							border-left: 4px solid #38ef7d;
						}
						.file-info p {
							margin: 8px 0;
							color: #495057;
						}
						.file-info strong {
							color: #212529;
						}
						.action-buttons {
							display: flex;
							gap: 15px;
							justify-content: center;
							flex-wrap: wrap;
						}
						.btn {
							padding: 12px 25px;
							border-radius: 25px;
							text-decoration: none;
							font-weight: 500;
							transition: all 0.3s ease;
							display: inline-block;
						}
						.btn-primary {
							background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
							color: white;
							box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
						}
						.btn-primary:hover {
							transform: translateY(-2px);
							box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
						}
						.btn-secondary {
							background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
							color: white;
							box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);
						}
						.btn-secondary:hover {
							transform: translateY(-2px);
							box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4);
						}
						@media (max-width: 768px) {
							.action-buttons { flex-direction: column; align-items: center; }
							.btn { width: 200px; }
						}
					</style>
				</head>
				<body>
					<div class="success-container">
						<div class="header">
							<div class="success-icon">✅</div>
							<h1>上傳成功！</h1>
							<p>您的檔案已成功儲存到雲端</p>
						</div>
						<div class="content">
							<div class="file-info">
								<p><strong>📄 檔案名稱：</strong> ${fileName}</p>
								<p><strong>📦 檔案大小：</strong> ${formatFileSize(file.size)}</p>
								<p><strong>🏷️ 檔案類型：</strong> ${file.type || "未知"}</p>
							</div>
							<div class="action-buttons">
								<a href="/" class="btn btn-primary">📁 查看檔案列表</a>
								<a href="/upload" class="btn btn-secondary">📤 繼續上傳</a>
							</div>
						</div>
					</div>
				</body>
				</html>
				`,
					{
						headers: {
							"content-type": "text/html; charset=utf-8",
						},
					}
				);
			} catch (error) {
				return new Response(`上傳錯誤: ${error.message}`, {
					status: 500,
					headers: {
						"content-type": "text/html; charset=utf-8",
					},
				});
			}
		}

		// 處理 /download/{fileName} 路徑 - 下載檔案
		if (request.method === "GET" && url.pathname.startsWith("/download/")) {
			try {
				const fileName = decodeURIComponent(url.pathname.substring(10)); // 移除 "/download/"

				// 從 R2 獲取檔案
				const object = await env.FILES.get(fileName);

				if (!object) {
					return new Response("檔案未找到", { status: 404 });
				}

				// 提取原始檔案名稱（移除時間戳前綴）
				const getOriginalFileName = (fullName) => {
					const match = fullName.match(/^\d+_(.+)$/);
					return match ? match[1] : fullName;
				};

				const originalFileName = getOriginalFileName(fileName);

				return new Response(object.body, {
					headers: {
						"Content-Type":
							object.httpMetadata?.contentType ||
							"application/octet-stream",
						"Content-Disposition": `attachment; filename="${originalFileName}"`,
						"Content-Length": object.size.toString(),
					},
				});
			} catch (error) {
				return new Response(`下載錯誤: ${error.message}`, {
					status: 500,
				});
			}
		}

		// 處理 /delete/{fileName} 路徑 - 刪除檔案
		if (request.method === "GET" && url.pathname.startsWith("/delete/")) {
			try {
				const fileName = decodeURIComponent(url.pathname.substring(8)); // 移除 "/delete/"

				// 從 R2 刪除檔案
				await env.FILES.delete(fileName);

				return new Response(
					`
				<!DOCTYPE html>
				<html lang="zh-TW">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>刪除成功 - R2 檔案管理系統</title>
					<style>
						* {
							margin: 0;
							padding: 0;
							box-sizing: border-box;
						}
						body {
							font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							min-height: 100vh;
							padding: 20px;
							display: flex;
							align-items: center;
							justify-content: center;
						}
						.success-container {
							max-width: 500px;
							width: 100%;
							background: white;
							border-radius: 20px;
							box-shadow: 0 20px 40px rgba(0,0,0,0.1);
							overflow: hidden;
							text-align: center;
						}
						.header {
							background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
							color: white;
							padding: 40px;
						}
						.success-icon {
							font-size: 4rem;
							margin-bottom: 20px;
							animation: fadeIn 0.6s ease-in-out;
						}
						@keyframes fadeIn {
							0% { opacity: 0; transform: scale(0.5); }
							100% { opacity: 1; transform: scale(1); }
						}
						.header h1 {
							font-size: 2rem;
							margin-bottom: 10px;
							font-weight: 300;
						}
						.content {
							padding: 30px;
						}
						.file-info {
							background: #fff3cd;
							padding: 20px;
							border-radius: 15px;
							margin-bottom: 30px;
							border-left: 4px solid #ffc107;
						}
						.file-info p {
							margin: 0;
							color: #856404;
						}
						.action-buttons {
							display: flex;
							gap: 15px;
							justify-content: center;
							flex-wrap: wrap;
						}
						.btn {
							padding: 12px 25px;
							border-radius: 25px;
							text-decoration: none;
							font-weight: 500;
							transition: all 0.3s ease;
							display: inline-block;
						}
						.btn-primary {
							background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
							color: white;
							box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
						}
						.btn-primary:hover {
							transform: translateY(-2px);
							box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
						}
						.btn-secondary {
							background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
							color: white;
							box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);
						}
						.btn-secondary:hover {
							transform: translateY(-2px);
							box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4);
						}
						@media (max-width: 768px) {
							.action-buttons { flex-direction: column; align-items: center; }
							.btn { width: 200px; }
						}
					</style>
				</head>
				<body>
					<div class="success-container">
						<div class="header">
							<div class="success-icon">🗑️</div>
							<h1>刪除成功！</h1>
							<p>檔案已從雲端儲存空間中移除</p>
						</div>
						<div class="content">
							<div class="file-info">
								<p><strong>已刪除檔案：</strong> ${fileName}</p>
							</div>
							<div class="action-buttons">
								<a href="/" class="btn btn-primary">📁 返回檔案列表</a>
								<a href="/upload" class="btn btn-secondary">📤 上傳新檔案</a>
							</div>
						</div>
					</div>
				</body>
				</html>
				`,
					{
						headers: {
							"content-type": "text/html; charset=utf-8",
						},
					}
				);
			} catch (error) {
				return new Response(`刪除錯誤: ${error.message}`, {
					status: 500,
					headers: {
						"content-type": "text/html; charset=utf-8",
					},
				});
			}
		}

		// 處理 /files 路徑 - 顯示 R2 中的所有檔案
		if (request.method === "GET" && url.pathname === "/files") {
			try {
				// 列出 R2 bucket 中的所有物件
				const objects = await env.FILES.list();

				// 除錯：輸出到控制台看看返回什麼
				console.log("R2 list result:", objects);
				console.log("Objects array:", objects.objects);
				console.log("Objects length:", objects.objects?.length);

				let tableRows = "";
				if (objects.objects && objects.objects.length > 0) {
					for (const obj of objects.objects) {
						// 格式化檔案大小函數
						const formatFileSize = (bytes) => {
							if (bytes === 0) return "0 B";
							const sizes = ["B", "KB", "MB", "GB", "TB"];
							const i = Math.floor(
								Math.log(bytes) / Math.log(1024)
							);
							return (
								Math.round((bytes / Math.pow(1024, i)) * 100) /
									100 +
								" " +
								sizes[i]
							);
						};

						// 提取原始檔案名稱（移除時間戳前綴）
						const getOriginalFileName = (fullName) => {
							const match = fullName.match(/^\d+_(.+)$/);
							return match ? match[1] : fullName;
						};

						const displayName = getOriginalFileName(obj.key);

						tableRows += `
							<tr>
								<td>
									<div style="font-weight: 500;">${displayName}</div>
									<div style="font-size: 0.8rem; color: #6c757d; margin-top: 2px;">儲存名稱: ${
										obj.key
									}</div>
								</td>
								<td><strong>${formatFileSize(obj.size)}</strong></td>
								<td>${obj.uploaded.toLocaleString("zh-TW")}</td>
								<td>
									<a href="/${
										obj.key
									}" target="_blank" class="action-btn download-btn">📥 下載</a>
									<a href="/delete/${obj.key}" 
									   onclick="return confirm('確定要刪除檔案「${displayName}」嗎？')" 
									   class="action-btn delete-btn">🗑️ 刪除</a>
								</td>
							</tr>
						`;
					}
				}

				const html = `
				<!DOCTYPE html>
				<html lang="zh-TW">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>R2 檔案列表</title>
					<style>
						* {
							margin: 0;
							padding: 0;
							box-sizing: border-box;
						}
						body {
							font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							min-height: 100vh;
							padding: 20px;
						}
						.container {
							max-width: 1200px;
							margin: 0 auto;
							background: white;
							border-radius: 15px;
							box-shadow: 0 20px 40px rgba(0,0,0,0.1);
							overflow: hidden;
						}
						.header {
							background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
							color: white;
							padding: 30px;
							text-align: center;
						}
						.header h1 {
							font-size: 2.5rem;
							margin-bottom: 10px;
							font-weight: 300;
						}
						.content {
							padding: 30px;
						}
						.stats {
							background: #f8f9fa;
							padding: 15px 25px;
							border-radius: 10px;
							margin-bottom: 25px;
							border-left: 4px solid #4facfe;
						}
						.stats p {
							font-size: 1.1rem;
							color: #6c757d;
							margin: 0;
						}
						.action-links {
							margin-bottom: 25px;
						}
						.btn-link {
							display: inline-block;
							padding: 12px 25px;
							border-radius: 25px;
							text-decoration: none;
							font-weight: 500;
							margin-right: 15px;
							transition: all 0.3s ease;
						}
						.btn-upload {
							background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
							color: white;
							box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);
						}
						.btn-upload:hover {
							transform: translateY(-2px);
							box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4);
						}
						.btn-home {
							background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
							color: white;
							box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
						}
						.btn-home:hover {
							transform: translateY(-2px);
							box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
						}
						table {
							width: 100%;
							border-collapse: collapse;
							border-radius: 10px;
							overflow: hidden;
							box-shadow: 0 0 20px rgba(0,0,0,0.1);
						}
						th {
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							color: white;
							padding: 20px 15px;
							text-align: left;
							font-weight: 500;
							font-size: 1rem;
						}
						td {
							padding: 15px;
							border-bottom: 1px solid #eee;
							vertical-align: middle;
						}
						tr:nth-child(even) {
							background-color: #f8f9fa;
						}
						tr:hover {
							background-color: #e3f2fd;
							transition: background-color 0.3s ease;
						}
						.action-btn {
							display: inline-block;
							padding: 6px 15px;
							border-radius: 20px;
							text-decoration: none;
							font-size: 0.9rem;
							font-weight: 500;
							margin-right: 8px;
							transition: all 0.3s ease;
						}
						.download-btn {
							background: #17a2b8;
							color: white;
						}
						.download-btn:hover {
							background: #138496;
							transform: translateY(-1px);
						}
						.delete-btn {
							background: #dc3545;
							color: white;
						}
						.delete-btn:hover {
							background: #c82333;
							transform: translateY(-1px);
						}
						.empty-state {
							text-align: center;
							padding: 50px 20px;
							color: #6c757d;
						}
						.empty-state h3 {
							margin-bottom: 15px;
							color: #495057;
						}
						@media (max-width: 768px) {
							body { padding: 10px; }
							.header h1 { font-size: 2rem; }
							.content { padding: 20px; }
							table { font-size: 0.9rem; }
							th, td { padding: 10px 8px; }
							.action-links { text-align: center; }
							.btn-link { 
								display: block; 
								width: fit-content;
								margin: 10px auto;
							}
						}
					</style>
				</head>
				<body>
					<div class="container">
						<div class="header">
							<h1>📁 R2 檔案列表</h1>
							<p>檔案管理備用入口</p>
						</div>
						<div class="content">
							<div class="stats">
								<p>📊 總共 <strong>${objects.objects.length}</strong> 個檔案</p>
							</div>
							<div class="action-links">
								<a href="/upload" class="btn-link btn-upload">📤 上傳檔案</a>
								<a href="/" class="btn-link btn-home">🏠 回到首頁</a>
							</div>
							${
								objects.objects.length > 0
									? `
							<table>
								<thead>
									<tr>
										<th>📄 檔案名稱</th>
										<th>📦 檔案大小</th>
										<th>⏰ 上傳時間</th>
										<th>⚙️ 操作</th>
									</tr>
								</thead>
								<tbody>
									${tableRows}
								</tbody>
							</table>
							`
									: `
							<div class="empty-state">
								<h3>📭 目前沒有任何檔案</h3>
								<p>點擊上方的「上傳檔案」按鈕開始上傳您的第一個檔案</p>
							</div>
							`
							}
						</div>
					</div>
				</body>
				</html>
				`;

				return new Response(html, {
					headers: {
						"content-type": "text/html; charset=utf-8",
					},
				});
			} catch (error) {
				return new Response(`錯誤: ${error.message}`, {
					status: 500,
					headers: {
						"content-type": "text/html; charset=utf-8",
					},
				});
			}
		}

		// 處理其他所有請求，返回 404
		return new Response(
			`
			<!DOCTYPE html>
			<html lang="zh-TW">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>頁面未找到 - R2 檔案管理系統</title>
				<style>
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}
					body {
						font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						min-height: 100vh;
						padding: 20px;
						display: flex;
						align-items: center;
						justify-content: center;
					}
					.error-container {
						max-width: 500px;
						width: 100%;
						background: white;
						border-radius: 20px;
						box-shadow: 0 20px 40px rgba(0,0,0,0.1);
						overflow: hidden;
						text-align: center;
					}
					.header {
						background: linear-gradient(135deg, #fd7e14 0%, #dc3545 100%);
						color: white;
						padding: 40px;
					}
					.error-icon {
						font-size: 5rem;
						margin-bottom: 20px;
						animation: shake 0.8s ease-in-out;
					}
					@keyframes shake {
						0%, 100% { transform: translateX(0); }
						10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
						20%, 40%, 60%, 80% { transform: translateX(5px); }
					}
					.header h1 {
						font-size: 2rem;
						margin-bottom: 10px;
						font-weight: 300;
					}
					.content {
						padding: 30px;
					}
					.error-info {
						background: #fff3cd;
						padding: 20px;
						border-radius: 15px;
						margin-bottom: 30px;
						border-left: 4px solid #ffc107;
					}
					.error-info p {
						margin: 0;
						color: #856404;
						line-height: 1.5;
					}
					.action-buttons {
						display: flex;
						gap: 15px;
						justify-content: center;
						flex-wrap: wrap;
					}
					.btn {
						padding: 12px 25px;
						border-radius: 25px;
						text-decoration: none;
						font-weight: 500;
						transition: all 0.3s ease;
						display: inline-block;
					}
					.btn-primary {
						background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
						color: white;
						box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
					}
					.btn-primary:hover {
						transform: translateY(-2px);
						box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
					}
					.btn-secondary {
						background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
						color: white;
						box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);
					}
					.btn-secondary:hover {
						transform: translateY(-2px);
						box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4);
					}
					@media (max-width: 768px) {
						.action-buttons { flex-direction: column; align-items: center; }
						.btn { width: 200px; }
					}
				</style>
			</head>
			<body>
				<div class="error-container">
					<div class="header">
						<div class="error-icon">🔍</div>
						<h1>404 - 頁面未找到</h1>
						<p>抱歉，您要訪問的頁面不存在</p>
					</div>
					<div class="content">
						<div class="error-info">
							<p><strong>可能的原因：</strong></p>
							<p>• 網址輸入錯誤</p>
							<p>• 頁面已被移動或刪除</p>
							<p>• 檔案連結已失效</p>
						</div>
						<div class="action-buttons">
							<a href="/" class="btn btn-primary">🏠 回到首頁</a>
							<a href="/upload" class="btn btn-secondary">📤 上傳檔案</a>
						</div>
					</div>
				</div>
			</body>
			</html>
			`,
			{
				status: 404,
				headers: {
					"content-type": "text/html; charset=utf-8",
				},
			}
		);
	},
};

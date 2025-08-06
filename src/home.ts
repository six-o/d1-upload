export function renderHome() {
	return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
    </head>
    <body>
      <h1>Welcome to the D1 Template</h1>
      <p>This is a simple application demonstrating how to use D1 with Cloudflare Workers.</p>
      <p>Use the following endpoints:</p>
      <ul>
        <li><a href="/files">View Files</a></li>
        <li><a href="/api/comments">View Comments</a></li>
        <li><a href="/legacy">Legacy View</a></li>
      </ul>
    </body>
  </html>
`;
}

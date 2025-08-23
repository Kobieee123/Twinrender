// netlify/functions/gdrive-proxy.js

exports.handler = async (event) => {
  const fileId = event.queryStringParameters?.fileId;
  const filename = event.queryStringParameters?.filename || 'download.zip';

  if(!fileId){
    return { statusCode: 400, body: 'Missing fileId' };
  }

  try {
    const url = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;

    const res = await fetch(url);
    if(!res.ok){
      const txt = await res.text();
      return { statusCode: res.status, body: txt };
    }

    const arrayBuf = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'application/octet-stream';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      },
      body: Buffer.from(arrayBuf).toString('base64'),
      isBase64Encoded: true
    };

  } catch (e){
    return { statusCode: 500, body: e.message };
  }
};

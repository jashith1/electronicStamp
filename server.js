const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.static('public'));

const upload = multer({ storage: multer.memoryStorage() });

if (!fs.existsSync('./uploads')) {
	fs.mkdirSync('./uploads');
}

app.get('/', (req, res) => {
	res.sendFile('index.html');
});

app.post('/upload', upload.single('file'), (req, res) => {
	if (!req.file || !req.file.buffer) {
		return res.status(400).send('No file uploaded.');
	}

	const hash = crypto.createHash('sha256');
	hash.update(req.file.buffer);
	const fileHash = hash.digest('hex');

	res.send('Hash of the file: ' + fileHash);
});

app.listen(3000, () => {
	console.log('BANZAI');
});

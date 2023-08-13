const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
app.use(express.static('public'));

const upload = multer({ storage: multer.memoryStorage() });

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
	modulusLength: 2048,
});

app.get('/', (req, res) => {
	res.sendFile('index.html');
});

// Upload and hash the file
app.post('/upload', upload.single('file'), (req, res) => {
	if (!req.file || !req.file.buffer) {
		return res.status(400).send('No file uploaded.');
	}

	const hash = crypto.createHash('sha256');
	hash.update(req.file.buffer);

	const fileHash = hash.digest('hex');

	// Sign the hash with the private key
	const signature = crypto.sign('sha256', Buffer.from(fileHash, 'hex'), {
		key: privateKey,
		padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
	});

	// Send the hash, signature, and public key to the client
	res.json({
		hash: fileHash,
		signature: signature.toString('base64'),
		publicKey: publicKey.export({ type: 'pkcs1', format: 'pem' }),
	});
});

// Verify the signature
app.post('/verify', upload.single('file'), (req, res) => {
	const { signature, publicKey } = req.body; // Assuming you send these in the request body

	if (!req.file || !req.file.buffer) {
		return res.status(400).send('No file uploaded.');
	}

	const hash = crypto.createHash('sha256');
	hash.update(req.file.buffer);
	const fileHash = hash.digest('hex');

	// Verify the signature using the provided public key
	const isVerified = crypto.verify(
		'sha256',
		Buffer.from(fileHash, 'hex'),
		{
			key: publicKey,
			padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
		},
		Buffer.from(signature, 'base64')
	);

	if (isVerified) {
		res.send('The signature is valid.');
	} else {
		res.send('The signature is NOT valid.');
	}
});

app.listen(3000, () => {
	console.log('Server is running on port 3000');
});

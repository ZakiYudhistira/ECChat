# ECChat - Elliptic Curve Encrypted Chat

A web-based end-to-end encrypted messaging application using Elliptic Curve Cryptography (ECC). Built with modern web technologies and real-time WebSocket communication.

🔗 **Live Demo**: [ecchat.zakiyudhistira.cloud](https://ecchat.zakiyudhistira.cloud)

## 🚀 Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite
- React Router v7
- Tailwind CSS + shadcn/ui
- WebSocket Client

**Backend:**
- Node.js + Express.js
- WebSocket Server (ws)
- MongoDB Atlas
- JWT Authentication

## 🔐 Cryptography

ECChat implements end-to-end encryption using the Web Crypto API with the following algorithms:

- **ECDH (P-521)** - Key exchange for shared secret generation
- **ECDSA (P-521)** - Digital signatures for message authentication
- **AES-GCM-256** - Symmetric encryption for message content
- **SHA-256** - Cryptographic hashing

### Encryption Workflow

1. **Registration**: Each user generates an ECC keypair (public/private). Public key is stored on the server.
2. **Key Exchange**: When starting a chat, users perform ECDH to derive a shared secret from their private key and the recipient's public key.
3. **Message Encryption**: Messages are encrypted with AES-GCM using the shared secret, then signed with ECDSA.
4. **Message Decryption**: Recipient verifies the signature, then decrypts using their derived shared secret.

All private keys stay on the client. The server never sees unencrypted messages.

## 🐳 Docker Setup

### Prerequisites
- Docker & Docker Compose installed
- MongoDB Atlas connection string
- (Optional) SSL certificates for HTTPS deployment

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/ZakiYudhistira/BicaraWebChat.git
cd BicaraWebChat
```

2. **Configure environment variables**

Create `backend-app/.env`:
```env
PORT=3000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
```

Create `frontend-app/.env`:
```env
VITE_BACKEND_URL=http://localhost:3000
VITE_WS_URL=wss://localhost:3000
```

3. **Run with Docker Compose**
```bash
docker compose up -d
```

4. **Access the application**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

## 📝 Notes

- **HTTPS Required**: Web Crypto API requires HTTPS in production (localhost exempt)
- **Browser Support**: Modern browsers with Web Crypto API support
- **Private Keys**: Never leave the browser, stored in memory only

## 👨‍💻 Author

**Zaki Yudhistira**  
GitHub: [@ZakiYudhistira](https://github.com/ZakiYudhistira)
GitHub: [@WazeAzure](https://github.com/WazeAzure)
GitHub: [@VansonK](https://github.com/VansonK)
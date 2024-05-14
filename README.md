# Rabbit Share

Welcome to **Rabbit Share**, a cutting-edge platform designed to transform the way you share files. Leveraging the robust technologies of Next.js, WebRTC, and Socket.IO, Rabbit Share enables users to create shareable links for local files, facilitating peer-to-peer (P2P) downloads without the need for uploading files to a server. This method ensures privacy, efficiency, and speed, redefining file sharing in the digital age.  

the sharing is annoymous and server won't store any data or information.

## Features

- **Direct File Sharing**: Generate links for your local files and share them directly with recipients. No cloud uploads mean enhanced security and faster transfers.
- **P2P Technology**: Utilize the power of WebRTC for peer-to-peer file transfers, ensuring that your files are shared without passing through any intermediaries.
- **Real-Time Communication**: Incorporating Socket.IO, Rabbit Share offers seamless real-time capabilities, making it easier to manage file sharing and communication.
- **Easy to Use**: With a user-friendly interface, sharing files is as simple as a few clicks.
- **Cross-Platform Compatibility**: Accessible from any device that supports a web browser, enabling you to share and download files on the go.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Node.js (LTS version)
- npm (comes bundled with Node.js)

### Installation

To set up Rabbit Share locally, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/shanzhengliu/rabbit-share.git
cd rabbit-share
```
2. Install the necessary packages:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

This will launch the Rabbit Share application on http://localhost:3000. Navigate to this URL in your web browser to start sharing files.


## How It Works
1. Choose a File: Select the local file you wish to share.
2. Generate Link: Rabbit Share creates a unique, shareable link for your file.
3. Share the Link/QR code: Send the link to your recipient.
4. P2P Download: The recipient uses the link to initiate a P2P download, receiving the file directly from your device.

## Docker Build
you can also build docker image for this application with 
```bash
docker build -t rabbit-share .
```

## Docker Compose Run
you can also running the application via Docker Compose
1. create a docker compose file.
```yaml
version: '3'
services:
  web:
    image: rabbit-share:latest
    ports:
      - "3000:3000"
```
2. Then, start the service by running:
```bash
docker-compose up
```
3. then access http://{your local network ip}:3000
## License
Distributed under the MIT License. See LICENSE for more information.
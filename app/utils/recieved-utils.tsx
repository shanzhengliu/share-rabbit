export class ReceivedUtils {
  socket: any;
  localConnection: RTCPeerConnection;
  receiveChannel: RTCDataChannel | undefined;
  receivedData: any = [];
  currentFileMetadata: any = {};
  lastReportedProgress: number = 0;
  progressCallback: (progress: number) => void;
  targetSocket: any;
  candidate: any;
  constructor(io: any) {
    this.socket = io;
    this.progressCallback = () => {};

    this.localConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.duocom.es:3478" },
      ],
    });

    this.localConnection.onicecandidate = (e) => {
      this.candidate = e.candidate;
    };

    this.socket.on("offer", (data: any) => {
      const { offer, targetSocket } = data;
      this.targetSocket = targetSocket;
      this.createAnswer(offer, targetSocket);
    });

    this.socket.on("fileMeta", (data: any) => {
      this.currentFileMetadata = data;
    });

    this.socket.on(
      "iceCandidate",
      (data: { candidate: RTCIceCandidateInit | undefined }) => {
        if (data.candidate && this.localConnection) {
          this.localConnection
            .addIceCandidate(new RTCIceCandidate(data.candidate))
            .catch((error) => {
              alert("Failed to connent, maybe share file provider is offline");
              console.error("Failed to add ICE Candidate:", error);
            });
        }
      }
    );
  }
  createAnswer = (offer: any, targetSocket: any) => {
    this.localConnection.ondatachannel = (event) => {
      this.receiveChannel = event.channel;
      this.receiveChannel.onmessage = this.handleReceiveMessage;
      this.receiveChannel.onopen = () => {
        alert("Connected to sender. Ready to receive file.");
        this.receiveChannel?.send("download");
      };
    };

    this.localConnection
      .setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => {
        return this.localConnection.createAnswer();
      })
      .then((answer) => {
        this.targetSocket = targetSocket;
        return this.localConnection.setLocalDescription(answer);
      })
      .then(() => {
        this.socket.emit("answer", {
          answer: this.localConnection.localDescription,
          targetSocket,
        });
      })
      .catch((error) => console.error("Error creating answer:", error));

    this.localConnection.onicecandidate = (e) => {
      if (e.candidate) {
        this.socket.emit("iceCandidate", {
          candidate: e.candidate.toJSON(),
          targetSocket: this.targetSocket,
          sender: "recieved-utils",
        });
      }
    };
  };

  sendDownloadRequest = (sharedId: any) => {
    if (this.receiveChannel?.readyState === "open") {
      console.log("Data channel is open and ready to be used. and donwload");
      this.receiveChannel.send("download");
    } else {
      this.socket.emit("requestOffer", { sharedId: sharedId });
    }
  };

  handleReceiveMessage = (event: any) => {
    if (typeof event.data === "string") {
      try {
        const metadata = JSON.parse(event.data);
        if (metadata.fileName && metadata.fileSize) {
          this.currentFileMetadata = metadata;
          this.receivedData = [];

          return;
        }

        if (metadata.lastReportedProgress) {
          console.log("Received file progress:", metadata.lastReportedProgress);
          this.lastReportedProgress = metadata.lastReportedProgress;
          this.progressCallback(this.lastReportedProgress);
          return;
        }
        if (metadata.flag == "FILE_TRANSFER_COMPLETE") {
          console.log("File transfer complete signal received");
          this.lastReportedProgress = 100;
          this.progressCallback(this.lastReportedProgress);
          this.assembleAndDownloadFile();
          return;
        }
      } catch (error) {
        console.log("data is not json:", error);
      }
    }
    this.receivedData.push(event.data);
  };

  setProgressCallback(callback: (progress: number) => void) {
    this.progressCallback = callback;
  }

  assembleAndDownloadFile = () => {
    const receivedBlob = new Blob(this.receivedData);
    this.receivedData = [];

    const fileName = this.currentFileMetadata
      ? this.currentFileMetadata.fileName
      : "received_file.bin";
    this.downloadFileFromBlob(receivedBlob, fileName);

    this.currentFileMetadata = null;
  };
  downloadFileFromBlob = (blob: Blob | MediaSource, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}

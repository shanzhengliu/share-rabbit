import { v4 as uuidv4 } from "uuid";

export class SendUtils {
  socket: any;
  dataChannel: RTCDataChannel;
  localConnection: RTCPeerConnection;
  chunkSize = 262144; // 256KB
  pauseSending = false;
  offset: any = 0;
  file: any;
  offerId: any;
  lastReportedProgress: number = 0;
  reportThreshold = 0;
  targetSocket: any;
  candidate: any;

  constructor(io: any, file: any) {
    this.socket = io;
    this.file = file;
    this.localConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.duocom.es:3478" },
      ],
    });

    this.localConnection.onicecandidate = (e) => {
      if (e.candidate) {
        this.candidate = e.candidate;
      }
      if (e.candidate) {
        this.socket.emit("iceCandidate", {
          candidate: e.candidate.toJSON(),
          targetSocket: this.targetSocket,
          sender: "send-utils",
        });
      }
    };

    this.dataChannel = this.localConnection.createDataChannel(
      "fileTransferChannel"
    );

    this.dataChannel.onbufferedamountlow = () => {
      if (this.pauseSending && this.offset < this.file.size) {
        this.pauseSending = false;
        this.readSlice(this.offset);
      }
    };
    this.setupDataChannelEvents();

    this.socket.on(
      "answer",
      (data: { answer: RTCSessionDescriptionInit; targetSocket: any }) => {
        if (this.localConnection) {
          const answer = new RTCSessionDescription(data.answer);
          this.targetSocket = data.targetSocket;
          this.localConnection
            .setRemoteDescription(answer)
            .then(() => {})
            .catch((error) =>
              console.error("Failed to set remote description:", error)
            );
        }
      }
    );

    this.socket.on(
      "iceCandidate",
      (data: { candidate: RTCIceCandidateInit | undefined }) => {
        if (data.candidate && this.localConnection) {
          this.localConnection
            .addIceCandidate(new RTCIceCandidate(data.candidate))
            .catch((error) =>
              console.error("Failed to add ICE Candidate:", error)
            );
        }
      }
    );
  }

  setupDataChannelEvents = () => {
    this.dataChannel!.onopen = () => {
      this.sendFile();
    };
    this.dataChannel!.onclose = () => {
      console.log("Data channel is closed.");
    };
    this.dataChannel.onmessage = (e) => {
      if (e.data === "download") {
        console.log("Received download request.");
        this.sendFile();
      }
    };
  };

  generateOfferId = () => {
    return uuidv4();
  };

  createOffer = (targetSocket: any) => {
    this.localConnection
      .createOffer()
      .then((offer) => {
        this.targetSocket = targetSocket;
        return this.localConnection.setLocalDescription(offer);
      })
      .then(() => {
        this.socket.emit("offer", {
          offer: this.localConnection.localDescription,
          targetSocket: targetSocket,
        });
      })
      .then(() => {
        this.socket.emit("iceCandidate", {
          candidate: this.candidate,
          targetSocet: this.targetSocket,
          sender: "sender-utils",
        });
      })
      .catch((error) => console.error("Error creating offer:", error));
  };

  readSlice = (sliceOffset: any) => {
    if (this.pauseSending) {
      setTimeout(() => {
        this.readSlice(sliceOffset);
      }, 100);
      return;
    }

    const slice = this.file.slice(sliceOffset, sliceOffset + this.chunkSize);
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.dataChannel.send(e.target.result);
      this.offset += e.target.result.byteLength;

      if (this.offset - this.lastReportedProgress >= this.reportThreshold) {
        this.lastReportedProgress = this.offset;
        this.dataChannel.send(
          `{"lastReportedProgress":${(
            (this.offset / this.file.size) *
            100
          ).toFixed(2)} }`
        );
      }
      if (this.offset < this.file.size) {
        if (
          this.dataChannel.bufferedAmount <=
          this.dataChannel.bufferedAmountLowThreshold
        ) {
          this.readSlice(this.offset);
        } else {
          this.pauseSending = true;
        }
      } else {
        this.dataChannel.send(`{"flag":"FILE_TRANSFER_COMPLETE"}`);
      }
    };

    reader.readAsArrayBuffer(slice);
  };

  sendFile = () => {
    this.reportThreshold = Math.floor(this.file.size / 10);

    const metadata = JSON.stringify({
      fileName: this.file.name,
      fileSize: this.file.size,
    });
    this.dataChannel.send(metadata);
    this.offset = 0;
    this.readSlice(0);
  };
}

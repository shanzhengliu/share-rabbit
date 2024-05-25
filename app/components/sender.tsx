import React, { useEffect, useState } from "react";
import { FileInput } from "flowbite-react";
import { useSocket } from "../utils/socket-context";
import { SendUtils } from "../utils/send-utils";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { translation } from "../utils/translation";
export const Sender: React.FC = () => {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [shareLink, setShareLink] = useState<string | null>(null); // [1
  const socket = useSocket();

  const fileOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setShareLink(null);
      const canvas = document.getElementById("canvas") as HTMLCanvasElement;
      canvas && canvas.style.setProperty("height", "0");
      canvas &&
        canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const copyTextToClipboard = async (text: any) => {
    if ("clipboard" in navigator) {
      try {
        await navigator.clipboard.writeText(text);
        console.log("Text copied to clipboard");
        alert("Text copied to clipboard");
      } catch (err) {
        console.error("Failed to copy: ", err);
        fallbackCopyTextToClipboard(text);
      }
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text: any) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const successful = document.execCommand("copy");
      const msg = successful ? "successful" : "unsuccessful";
      console.log(`Fallback: Copying text command was ${msg}`);
      alert(`Fallback: Copying text command was ${msg}`);
    } catch (err) {
      console.error("Fallback: Oops, unable to copy", err);
    }
    document.body.removeChild(textarea);
  };

  useEffect(() => {
    if (!socket) {
      return;
    }
    if (socket) {
      const createOfferListener = (event: any) => {
        if (!file) {
          console.log("No file selected yet.");
          return;
        }

        const utils = new SendUtils(socket, file);
        utils.createOffer(event.targetSocket);
      };
      socket.off("createOffer", createOfferListener);
      socket.on("createOffer", createOfferListener);
    }
  }, [socket, file]);

  const generateOfferId = () => {
    return uuidv4();
  };

  const shareButtonOnClick = async () => {
    if (file && socket) {
      const sharedId = generateOfferId();
      const shareLink = `${window.location.origin}?offerId=${sharedId}`;
      setShareLink(shareLink);
      const canvas = document.getElementById("canvas");
      try {
        QRCode.toCanvas(canvas, shareLink, function (error: any) {
          if (error) console.error(error);
        });
      } catch (err) {
        console.error(err);
      }
      socket?.emit("createShare", {
        sharedId,
        fileMeta: { fileName: file.name, fileSize: file.size },
      });
    }
  };

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="p-6 max-w-sm w-full bg-white shadow-md rounded-lg text-center">
        <FileInput onChange={fileOnChange} />

        <div className="flex justify-center mt-4">
          <button
            onClick={shareButtonOnClick}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transform transition-all duration-150 ease-in-out"
          >
            {translation("generateShareLink")}
          </button>
        </div>
        <div className="flex justify-center mt-4 w-full">
          <canvas id="canvas" style={{ height: 0 }}></canvas>
        </div>
        {shareLink && (
          <div className="mt-4 space-x-2 flex justify-center">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={shareLink}
              className="inline-block bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transform transition-all duration-150 ease-in-out"
            >
              {translation("openLink")}
            </a>

            <button
              onClick={() => {
                copyTextToClipboard(shareLink);
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transform transition-all duration-150 ease-in-out"
            >
              {translation("copyLink")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

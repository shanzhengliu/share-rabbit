import { useEffect, useRef, useState } from "react";
import { useSocket } from "../utils/socket-context";
import React from "react";
import { ReceivedUtils } from "../utils/recieved-utils";
import { translation } from "../utils/translation";
interface ReceivedUtilsRef {
  current: ReceivedUtils | null;
}

export const Receiver = (props: { sharedId: any }) => {
  const recievedUtilsRef: ReceivedUtilsRef = useRef<ReceivedUtils | null>(null);
  const socket = useSocket();
  const [offerId, setOfferId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>("");
  const [filesize, setFilesize] = useState<string | null>("");
  const [recievedUtils, setRecievedUtils] = useState<ReceivedUtils | null>(
    null
  );
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!recievedUtilsRef.current && socket) {
      recievedUtilsRef.current = new ReceivedUtils(socket);
      setRecievedUtils(recievedUtilsRef.current);

      setOfferId(props.sharedId);
      socket.emit("fileMeta", { sharedId: props.sharedId });

      socket.on("fileMeta", (data: any) => {
        setFileName(data.fileName);
        setFilesize(data.fileSize);
      });
    }
  }, [socket]);

  useEffect(() => {
    if (recievedUtils) {
      recievedUtils.setProgressCallback((progress) => {
        setProgress(progress);
      });
    }
  }, [recievedUtils]);

  const getfilesize = (size: number) => {
    if (!size) return "";

    var num = 1024.0; //byte

    if (typeof size === "number" && size < num) return size + "B";
    if (typeof size === "number" && size < Math.pow(num, 2))
      return (size / num).toFixed(2) + "K"; //kb
    if (typeof size === "number" && size < Math.pow(num, 3))
      return (size / Math.pow(num, 2)).toFixed(2) + "M"; //M
    if (typeof size === "number" && size < Math.pow(num, 4))
      return (size / Math.pow(num, 3)).toFixed(2) + "G"; //G
    return (size / Math.pow(num, 4)).toFixed(2) + "T"; //T
  };

  if (fileName === "") {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-100">
        <div className="p-6 rounded-lg shadow-lg bg-white max-w-md text-center space-y-4">
          <span className="block text-lg font-medium text-gray-800">
            Sorry your file share link is invalid,<br></br> Maybe your file share provider has left.
          </span>
        </div>
      </div>
    );
  }
  return (
<div className="flex flex-col items-center justify-center w-full h-screen bg-gray-100">
<div className="p-4 md:p-6 lg:p-8 rounded-lg shadow-lg bg-white max-w-md md:max-w-lg space-y-3 md:space-y-4">
  <span className="block text-sm font-medium text-gray-800">
    {translation("sharedId")}: <span className="font-semibold">{offerId}</span>
  </span>
  <span className="block text-sm font-medium text-gray-800">
    {translation("fileName")}: <span className="font-semibold">{fileName}</span>
  </span>
  <span className="block text-sm font-medium text-gray-800">
    {translation("fileSize")}:
    <span className="font-semibold">{getfilesize(filesize ? Number(filesize) : 0)}</span>
  </span>

  {/* Button container with flex and centering */}
  <div className="flex justify-center w-full">
    <button
      onClick={() => recievedUtilsRef.current?.sendDownloadRequest(offerId)}
      className="px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
    >
      {translation("download")}
    </button>
  </div>

  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
    <div
      className={`bg-blue-600 h-1.5 rounded-full`}
      style={{ width: `${progress}%` }}
    ></div>
  </div>

  <div className="text-sm font-medium">{progress}%</div>
</div>
</div>



  );
};

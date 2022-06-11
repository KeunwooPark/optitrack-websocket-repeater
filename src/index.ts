import * as dgram from 'node:dgram';
import { WebSocketServer } from 'ws';
import settings from './settings'

const messageIds = {
    NAT_PING                  : 0,
    NAT_PINGRESPONSE          : 1,
    NAT_REQUEST               : 2,
    NAT_RESPONSE              : 3,
    NAT_REQUEST_MODELDEF      : 4,
    NAT_MODELDEF              : 5,
    NAT_REQUEST_FRAMEOFDATA   : 6,
    NAT_FRAMEOFDATA           : 7,
    NAT_MESSAGESTRING         : 8,
    NAT_DISCONNECT            : 9,
    NAT_UNRECOGNIZED_REQUEST  : 100
}
const MULTICAST_INTERFACE = "239.255.42.99";

const wss = new WebSocketServer({port: settings.websocket.port});

const socket = dgram.createSocket('udp4');
const dataSocket = dgram.createSocket('udp4');

dataSocket.on("listening", () => {
    console.log("listening");
    dataSocket.setBroadcast(true);
    dataSocket.addMembership(MULTICAST_INTERFACE)
})

dataSocket.bind(settings.optitrack.server_port);

dataSocket.on("message", (message: Buffer, remote: dgram.RemoteInfo) => {
    console.log(`message from ${remote.address}:${remote.port}`);
    console.log(message);
});

sendCommand(6, "");

wss.on("connection", (ws) => {
    ws.on("message", (data, isBinary) => {
        const dataStr = data.toString("utf-8");
        const jsonData = JSON.parse(dataStr);
        
        const command = jsonData.natNetCommand as number;
        const commandStr = jsonData.natNetCommandStr;
        console.log("sent command", jsonData, command, commandStr);

        sendCommand(command, commandStr);
    });

    socket.on('message', (message: Buffer, remote: dgram.RemoteInfo) => {
        console.log(`message from ${remote.address}:${remote.port}`);
        console.log(message.toString("utf-8"));
        ws.send(message);
    });
});

function sendCommand(command: number, commandStr = ""): void {
    let packetSize: number = 0;
    if (command === messageIds.NAT_REQUEST_MODELDEF || command === messageIds.NAT_REQUEST_FRAMEOFDATA) {
        packetSize = 0;
        commandStr = "";
    }

    const encoder = new TextEncoder();
    const commandBuffer = new Uint8Array([command]);
    const packetSizeBuffer = new Uint8Array([packetSize]);
    const commandStrBuffer = encoder.encode(commandStr);
    const nullCharBuffer = new Uint8Array([0]);

    let dataBuffer = new Uint8Array(commandBuffer.length + packetSizeBuffer.length + commandStrBuffer.length + nullCharBuffer.length);
    dataBuffer.set(commandBuffer);
    dataBuffer.set(packetSizeBuffer, commandBuffer.length);
    dataBuffer.set(commandStrBuffer, commandBuffer.length + packetSizeBuffer.length);
    dataBuffer.set(nullCharBuffer, commandBuffer.length + packetSizeBuffer.length + commandStrBuffer.length);

    socket.send(dataBuffer, settings.optitrack.command_port, settings.optitrack.host, (err, bytes) => {
        console.log("send err", err);
    });
}
import * as dgram from 'node:dgram';

const MULTICAST_INTERFACE = '192.168.0.2';
const SERVER_HOST = "192.168.0.2";
const SERVER_PORT = 1511;
const COMMAND_PORT = 1510;

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

const socket = dgram.createSocket('udp4');

socket.on('message', (message: Buffer, remote: dgram.RemoteInfo) => {
    console.log(`message from ${remote.address}:${remote.port}`);
    console.log(message.toString());
});

sendCommand(messageIds.NAT_REQUEST_MODELDEF);

function sendCommand(command: number): void {
    let packetSize: number = 0;
    let commandStr: string = "";
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

    console.log(commandBuffer, packetSizeBuffer, commandStrBuffer);

    socket.send(dataBuffer, COMMAND_PORT, SERVER_HOST, (err, bytes) => {
        console.log("data sent", dataBuffer);
    });
}
import { PubSub } from '@google-cloud/pubsub';
import { ServiceName, SpringOutMessage, SpringOutMessageType } from './types';

let pubsub: PubSub | null = null;

export const init = (ps: PubSub) => {
    pubsub = ps;
}

export const publish = async (serviceName: ServiceName, msg: SpringOutMessage, typeName: SpringOutMessageType) => {
    if (!pubsub) {
        throw new Error(`pubsub not initialized`);
    }
    const data = Buffer.from(JSON.stringify(msg));

    // need to publish the name of the type as meta-data on the message
    // so we know what to cast it to when we receive it
    await pubsub.topic(serviceName).publish(data, { ['type']: typeName });
}
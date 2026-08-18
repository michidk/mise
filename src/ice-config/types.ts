export interface IceServerFactoryOptions {
  stunUrls: string;
  turnUrls?: string;
  turnSharedSecret?: string;
  turnTtlSeconds?: number;
}

export interface IceServerFactory {
  create(): RTCIceServer[];
}

export class Configs {
  static instance: Configs;

  /**
   * @type {boolean} - Whether the app is running in a development environment or not. Default true.
   */
  public static readonly __DEV__: boolean = true;
  public static readonly AppName: string = 'DFSP Portal';
  // public readonly BASE_URL: string = 'https://dfspportal.participant.test.sanbox.wynepayhubsanbox-pre.com:444'
  public readonly BASE_URL: string = 'http://localhost:8003';
  // prevent new with private constructor
  private constructor() {}

  static getInstance(): Configs {
    if (!Configs.instance) {
      Configs.instance = new Configs();
    }
    return Configs.instance;
  }
}

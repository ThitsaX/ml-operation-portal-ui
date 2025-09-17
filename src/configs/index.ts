export class Configs {
  private static instance: Configs;

  public readonly APP_NAME = 'Operation Portal';
  
  private constructor() {
  }

  static getInstance(): Configs {
    if (!Configs.instance) {
      Configs.instance = new Configs();
    }
    return Configs.instance;
  }
}

export enum ApiStatus {
  /** Api is fine and running */
  Ok = 'ok',
  /** An error occured, see for more details error prop */
  Error = 'error',
  /** api is not fully operational */
  Pending = 'pending',
}

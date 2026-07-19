import styles from './hello-world.module.css';

export interface HelloWorldProps {
  appName: string;
  children?: React.ReactNode;
}

export function HelloWorld({ appName, children }: HelloWorldProps) {
  return (
    <section className={styles.container}>
      <h1>Hello from {appName}</h1>
      {children}
    </section>
  );
}

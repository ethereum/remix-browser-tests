import * as net from 'net';

/**
 * Check if a specific port is available.
 * @param port - The port to check.
 * @returns Promise<boolean> - True if available, false otherwise.
 */
const isPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false); // Port is not available
    });

    server.once('listening', () => {
      server.close(); // Close the server immediately
      resolve(true); // Port is available
    });

    server.listen(port); // Try to bind to the port
  });
};

/**
 * Find an available port from the provided list, or return a random one.
 * @param ports - Array of ports to check.
 * @returns Promise<number> - Available port number.
 */
export const findAvailablePort = async (ports: number[]): Promise<number> => {
  for (const port of ports) {
    const available = await isPortAvailable(port);
    if (available) {
      console.log(`Port ${port} is available.`);
      return port;
    }
  }

  // Fallback: find a random available port
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
      const address = server.address();
      if (typeof address === 'object' && address?.port) {
        console.log(`No specified ports available. Using random port ${address.port}.`);
        resolve(address.port);
      }
      server.close();
    });
  });
};


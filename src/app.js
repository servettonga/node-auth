import { createServer } from './utils/server.js';

try {
    const server = await createServer();
    server.listen(3000, () => {
        console.log(`Server is running on port 3000`)
    })
}
catch (error) {
    console.log(`Error: ${error}`)
}

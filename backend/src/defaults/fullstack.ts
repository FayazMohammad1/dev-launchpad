export const basePrompt = `
<boltArtifact id="project-import" title="Fullstack Project Files">

  <!-- ====================== -->
  <!--  BACKEND: Node Server  -->
  <!-- ====================== -->

  <boltAction type="directory" path="server">
    
    <boltAction type="file" filePath="server/package.json">
{
  "name": "fullstack-backend",
  "version": "1.0.0",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "dev": "node index.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  }
}
    </boltAction>

    <boltAction type="file" filePath="server/index.js">
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Node backend!" });
});

app.listen(3001, () => console.log("Backend running on port 3001"));
    </boltAction>

  </boltAction>


  <!-- ====================== -->
  <!--  FRONTEND: React App   -->
  <!-- ====================== -->

  <boltAction type="directory" path="client">

    <boltAction type="file" filePath="client/index.html">
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fullstack App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/client/src/main.tsx"></script>
  </body>
</html>
    </boltAction>

    <boltAction type="file" filePath="client/package.json">
{
  "name": "fullstack-client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.2",
    "typescript": "^5.5.3"
  }
}
    </boltAction>

    <boltAction type="file" filePath="client/src/main.tsx">
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
    </boltAction>

    <boltAction type="file" filePath="client/src/App.tsx">
import React, { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message));
  }, []);

  return (
    <div style={{ padding: 40, fontSize: 24 }}>
      <p>Frontend connected to Backend:</p>
      <p><strong>{message}</strong></p>
    </div>
  );
}

export default App;
    </boltAction>

  </boltAction>

</boltArtifact>
`;

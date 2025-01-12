import React from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Scene from "./Scene";
import { ScrollProvider } from "./ScrollContext";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ScrollProvider>
        <Canvas>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </ScrollProvider>
    </div>
  );
}

export default App;

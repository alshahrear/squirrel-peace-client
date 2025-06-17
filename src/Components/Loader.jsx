// src/components/Loader.jsx
import { SyncLoader } from "react-spinners";

const Loader = () => (
  <div className="flex justify-center mt-12 ">
    <SyncLoader color="#2acb35" size={15} />
  </div>
);

export default Loader;

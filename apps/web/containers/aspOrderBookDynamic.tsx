import dynamic from "next/dynamic";

export default dynamic(() => import("./async-page-orderBook"), {
  ssr: false,
});



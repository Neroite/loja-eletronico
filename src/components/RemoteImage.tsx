import Image, { type ImageProps } from "next/image";

export default function RemoteImage(props: ImageProps) {
  return <Image referrerPolicy="no-referrer" {...props} />;
}

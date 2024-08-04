import { useLocation } from "wouter";

export function Logo() {
  const navigate = useLocation()[1];

  return (
    <div
      className="flex flex-col items-center justify-center cursor-pointer"
      onClick={() => navigate("/")}
    >
      <img src="/open-book.png" className="w-16 invert" />
      <h1 className="source-serif-4 text-6xl font-bold text-center text-white">
        YART
      </h1>
      <h1 className="mb-4 text-xs text-center text-white">
        Yet another reading tool
      </h1>
    </div>
  );
}

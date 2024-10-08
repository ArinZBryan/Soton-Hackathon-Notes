/**
 * This code was generated by Builder.io.
 */
import React from "react";
import Header from "./Header";
import ActionButton from "./ActionButton";

export function Speech2Txt() {
  return (
    <main className="overflow-hidden py-3.5 pl-20 bg-white max-md:pl-5">
      <div className="flex gap-5 max-md:flex-col">
        <section className="flex flex-col w-[46%] max-md:ml-0 max-md:w-full">
          <div className="flex z-10 flex-col self-stretch my-auto mr-0 text-black max-md:mt-10 max-md:max-w-full">
            <Header />
            <div className="flex flex-col items-start self-end mt-44 max-w-full text-4xl w-[744px] max-md:mt-10">
              <h2 className="self-stretch text-7xl font-medium bg-blend-darken max-md:max-w-full max-md:text-4xl">
                Tired of taking notes?{" "}
                <span className="text-red-600">we've got you covered</span>
              </h2>
              <p className="mt-20 font-light max-md:mt-10 max-md:max-w-full">
                Summarize your lectures into notes{" "}
              </p>
              <ActionButton text="Start Recording" href="/record"/>
              <ActionButton text="Enter Text" href="text"/>
            </div>
          </div>
        </section>
        <aside className="flex flex-col ml-5 w-[54%] max-md:ml-0 max-md:w-full">
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/87c311fdb467ab4e185be39e5cfd21d95adbee873be97d48ef6adff7ea64ae01?placeholderIfAbsent=true&apiKey=3ff854c601444c60bc1c557a81bfe453"
            alt="Illustration representing speech to text conversion"
            className="object-contain grow w-full aspect-[0.99] max-md:mt-3.5 max-md:max-w-full"
          />
        </aside>
      </div>
    </main>
  );
};

export default Speech2Txt;

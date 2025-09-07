"use client";

import { useParams } from "next/navigation";
import LayoutOption1 from "../layout-option-1";
import LayoutOption2 from "../layout-option-2";
import LayoutOption3 from "../layout-option-3";
import LayoutOption4 from "../layout-option-4";
import LayoutOption5 from "../layout-option-5";
import LayoutOption6 from "../layout-option-6";
import LayoutOption7 from "../layout-option-7";
import LayoutOption8 from "../layout-option-8";
import LayoutOption9 from "../layout-option-9";
import LayoutOption10 from "../layout-option-10";
import SingleMissions from "../single-missions";

export default function ContractLayoutPage() {
  const params = useParams();
  const layout = params?.layout as string;
  
  switch(layout) {
    case "layout-option-1":
      return <LayoutOption1 />;
    case "layout-option-2":
      return <LayoutOption2 />;
    case "layout-option-3":
      return <LayoutOption3 />;
    case "layout-option-4":
      return <LayoutOption4 />;
    case "layout-option-5":
      return <LayoutOption5 />;
    case "layout-option-6":
      return <LayoutOption6 />;
    case "layout-option-7":
      return <LayoutOption7 />;
    case "layout-option-8":
      return <LayoutOption8 />;
    case "layout-option-9":
      return <LayoutOption9 />;
    case "layout-option-10":
      return <LayoutOption10 />;
    case "layout-option-11":
      return <SingleMissions />;
    case "single-missions":
      return <SingleMissions />;
    default:
      return (
        <div className="min-h-screen bg-black text-white p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-yellow-400 mb-8">Contract Layout Options</h1>
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4,5,6,7,8,9,10,11].map(n => (
                <a
                  key={n}
                  href={n === 11 ? `/contracts/single-missions` : `/contracts/layout-option-${n}`}
                  className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg transition-all"
                >
                  <h2 className="text-2xl font-bold text-yellow-400 mb-2">Layout Option {n}</h2>
                  <p className="text-gray-400">
                    {n === 1 && "Garrison-inspired with detailed panels"}
                    {n === 2 && "Horizontal flow with compact stats"}
                    {n === 3 && "Two-column epic socket design"}
                    {n === 4 && "Centered pills and 3-column rewards"}
                    {n === 5 && "WoW Garrison style with epic sockets"}
                    {n === 6 && "Based on Option 2 - Full-width graphs"}
                    {n === 7 && "Based on Option 3 - Full-width, bigger"}
                    {n === 8 && "Hybrid design - Maximum size"}
                    {n === 9 && "Option 7 with 30% reduced scaling"}
                    {n === 10 && "Side-by-side compact layout"}
                    {n === 11 && "Stacked layout with integrated header"}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>
      );
  }
}
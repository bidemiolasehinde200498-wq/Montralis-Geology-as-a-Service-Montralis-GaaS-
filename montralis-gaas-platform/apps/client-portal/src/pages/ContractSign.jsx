import React, { useState } from 'react';


export default function ContractSign({ activeTarget }) {
 const [signed, setSigned] = useState(false);


 return (
   <div className="max-w-2xl bg-slate-950 p-6 rounded-lg border border-slate-800 shadow-2xl">
     <h2 className="text-xl font-bold mb-1">Digital Offtake & Community Wellness Escrow</h2>
     <p className="text-xs text-slate-400 mb-6">
       Locking this agreement binds your coordinates to 100% processing rights and deploys local medical infrastructure shields.
     </p>


     {activeTarget ? (
       <div className="space-y-4">
         <div className="bg-slate-900 p-4 rounded text-xs font-mono text-slate-300 border border-slate-800 space-y-2">
           <p className="text-emerald-400 font-bold">--- MONTRALIS GLOBAL SECURE DEED ---</p>
           <p>CONCESSIONAIRE: Tier-1 Registered Local Mining Cooperative</p>
           <p>COORDINATE LOCK: {activeTarget.latitude}, {activeTarget.longitude}</p>
           <p>COMMODITY SPECIFICATION: Refined {activeTarget.mineral_target} Hydroxide Pipeline Base</p>
           <p>PROVISION MANDATE: Free MediBridge Healthcare Virtual Bed Licenses Activated on Signature.</p>
         </div>


         <button
           onClick={() => setSigned(true)}
           disabled={signed}
           className={`w-full font-bold py-3 rounded transition ${
             signed
               ? 'bg-slate-800 text-slate-500 border border-slate-700'
               : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
           }`}
         >
           {signed ? '🔒 AGREEMENT IMMUTABLY SIGNED & VAULTED' : 'Authorize Exclusive Offtake Agreement'}
         </button>
       </div>
     ) : (
       <p className="text-sm text-slate-500">
         Run a planetary scan first inside the Exploration Cockpit to generate an automated dynamic deed structure.
       </p>
     )}
   </div>
 );
}

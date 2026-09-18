/**
 * Shared brand shell for the intake surfaces (the walk and the public entry):
 * APEX MD navbar with a red accent underline, the logo atop a centered card.
 */
export default function IntakeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="h-16 bg-white border-b-[3px] border-[#e11816] flex items-center px-5 shadow-sm">
        <img src="/images/apex-md-logo.png" alt="APEX MD" className="h-8 w-auto" />
      </div>
      <div className="flex-1 flex justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex justify-center pb-5 mb-6 border-b border-slate-100">
              <img
                src="/images/apex-md-logo.png"
                alt="APEX MD"
                className="h-9 w-auto"
              />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

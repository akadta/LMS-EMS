import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { assessmentApi } from "../../api/assessmentApi";
import AssessmentSetupModal from "./AssessmentSetupModal";

export default function AssessmentEntryButton({ entityType, entityId, style }) {
  const [showSetup, setShowSetup] = useState(false);
  const navigate = useNavigate();

  const open = async () => {
    const res = await assessmentApi.forEntity(entityType, entityId);
    if (res.data.data) navigate(`/assessments/${res.data.data.id}`);
    else setShowSetup(true);
  };

  return (
    <>
      <button type="button" onClick={open} style={style}>
        <Sparkles size={13} /> Final Assessment
      </button>
      {showSetup && (
        <AssessmentSetupModal
          entityType={entityType}
          entityId={entityId}
          onClose={() => setShowSetup(false)}
          onSaved={(data) => navigate(`/assessments/${data.id}`)}
        />
      )}
    </>
  );
}

import UserFormPersonal from "./UserFormPersonal";
import UserFormBodyMetrics from "./UserFormBodyMetrics";
import UserFormSubscription from "./UserFormSubscription";

export default function NewUserForm({ form, errors, loading, step, onChange, onNext, onBack, onSubmit }) {
  const renderStep = () => {
    switch (step) {
      case 1: return <UserFormPersonal data={form} errors={errors} onChange={onChange} onNext={onNext} />;
      case 2: return <UserFormBodyMetrics data={form} errors={errors} onChange={onChange} onBack={onBack} onNext={onNext} />;
      case 3: return <UserFormSubscription data={form} errors={errors} onChange={onChange} onBack={onBack} onSubmit={onSubmit} loading={loading} />;
      default: return null;
    }
  };
  return <form className="newUserForm" onSubmit={(e)=>e.preventDefault()}>{renderStep()}</form>;
}

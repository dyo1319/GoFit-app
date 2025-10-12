import UserFormPersonal from "./UserFormPersonal";
import UserFormBodyMetrics from "./UserFormBodyMetrics";
import UserFormSubscription from "./UserFormSubscription";

export default function NewUserForm({ 
  form, 
  errors, 
  loading, 
  step, 
  onChange, 
  onNext, 
  onBack, 
  onSubmit, 
  disabled = false 
}) {
  const renderStep = () => {
    const commonProps = {
      form: form, 
      errors: errors,
      onChange: onChange,
      disabled: disabled
    };

    switch (step) {
      case 1: 
        return (
          <UserFormPersonal 
            {...commonProps}
            onNext={onNext}
            duplicateCheckLoading={loading.duplicateCheck}
          />
        );
      case 2: 
        return (
          <UserFormBodyMetrics 
            {...commonProps}
            onBack={onBack}
            onNext={onNext}
          />
        );
      case 3: 
        return (
          <UserFormSubscription 
            {...commonProps}
            onBack={onBack}
            onSubmit={onSubmit}
            loading={loading.submit}
          />
        );
      default: 
        return null;
    }
  };

  return (
    <form 
      className="newUserForm" 
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      {renderStep()}
    </form>
  );
}
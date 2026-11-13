import { useClientAuth } from "./ClientAuthContext";
import { hasAction } from "./permissionConfig";

// useCan("category") -> { canAdd, canEdit, canDelete }
// dealer এর জন্য সব true, staff এর জন্য permission অনুযায়ী
const useCan = (moduleKey) => {
  const { clientUser } = useClientAuth();
  const isStaff = clientUser?.isStaff === true;
  const check = (action) => !isStaff || hasAction(clientUser?.permissions, moduleKey, action);
  return {
    canAdd: check("post"),
    canEdit: check("put"),
    canDelete: check("delete"),
  };
};

export default useCan;
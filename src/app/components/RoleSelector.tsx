interface Props {
    script: Array<{character: string; text: string}>;
    selectedRole: string;
    onRoleSelect: (role: string) => void;
  }
  
  export default function RoleSelector({ script, selectedRole, onRoleSelect }: Props) {
    const uniqueRoles = [...new Set(script.map(line => line.character))];
  
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">Select Your Role:</label>
        <select
          value={selectedRole}
          onChange={(e) => onRoleSelect(e.target.value)}
          className="w-full p-2 border rounded text-gray-500"
        >
          <option value="">Choose a role...</option>
          {uniqueRoles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>
    );
  }
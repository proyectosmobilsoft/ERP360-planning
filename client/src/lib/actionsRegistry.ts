type ActionEntry = {
  code: string;
  title: string;
};

type ViewEntry = {
  code: string;
  title: string;
  actions: ActionEntry[];
};

const registry = new Map<string, ViewEntry>();

export function registerView(code: string, title: string) {
  if (!registry.has(code)) {
    registry.set(code, { code, title, actions: [] });
  }
}

export function registerAction(viewCode: string, actionTitle: string, actionCode: string) {
  const view = registry.get(viewCode);
  if (!view) return;
  if (!view.actions.find(a => a.code === actionCode)) {
    view.actions.push({ code: actionCode, title: actionTitle });
  }
}

export function getPermissionsJson(): ViewEntry[] {
  return Array.from(registry.values());
}



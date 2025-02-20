export default function filterObjectKeys(object: Record<string, any>, search: string) {
  const filteredObject: Record<string, any> = {};

  Object.keys(object).forEach((key) => {
    if (key.includes(search)) {
      filteredObject[key] = object[key];
    }
  });

  return filteredObject;
}

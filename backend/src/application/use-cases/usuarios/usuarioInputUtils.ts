import { AppError } from "../../../shared/errors/AppError";

export const normalizeAreaIds = (
  areaIdsInput: Array<number | string> | undefined,
  areaIdInput: number | string | null | undefined,
) => {
  const fromArray = Array.isArray(areaIdsInput) ? areaIdsInput : [];
  const merged = [areaIdInput, ...fromArray]
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  return Array.from(new Set(merged));
};

export const ensureAreaIds = (
  areaIdsInput: Array<number | string> | undefined,
  areaIdInput: number | string | null | undefined,
) => {
  const areaIds = normalizeAreaIds(areaIdsInput, areaIdInput);
  if (areaIds.length === 0) {
    throw new AppError("Debe seleccionar al menos un area", 400);
  }

  return areaIds;
};

export const buildEmailConfig = (nombre?: string | null, emailPersonal?: string | null): string => {
  if (nombre && String(nombre).trim()) {
    const firstName = String(nombre).trim().split(" ")[0];
    return firstName
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "_");
  }

  if (emailPersonal && String(emailPersonal).trim()) {
    const emailName = String(emailPersonal).split("@")[0];
    return emailName.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  }

  return "MAIN";
};

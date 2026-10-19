"use client";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { LoaderCircle, MapPin } from "lucide-react";
import { FieldError } from "@/components/ui/form-controls";
import { addressSchema, type LocationPoint } from "@/lib/address";
import { LocationMap } from "@/components/ui/location-map";

export function AddressFields() {
  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitted },
  } = useFormContext();
  const submitted = useRef(isSubmitted);
  useEffect(() => {
    submitted.current = isSubmitted;
  }, [isSubmitted]);
  const cep = String(watch("addressDetails.postalCode") ?? "").replace(
    /\D/g,
    "",
  );
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [point, setPoint] = useState<LocationPoint>();
  const [mapStatus, setMapStatus] = useState("");
  const [locating, setLocating] = useState(false);
  const manuallyAdjusted = useRef(false);
  const values = watch("addressDetails");
  const addressIsComplete = addressSchema.safeParse(values).success;
  const addressStarted = Object.values(values ?? {}).some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  const addressKey = JSON.stringify([
    values?.postalCode,
    values?.street,
    values?.number,
    values?.neighborhood,
    values?.city,
    values?.state,
  ]);
  useEffect(() => {
    manuallyAdjusted.current = false;
    setValue("addressDetails.location", undefined);
    setPoint(undefined);
    setMapStatus("");
    setLocating(false);
    const input = getValues("addressDetails");
    if (
      String(input?.postalCode ?? "").replace(/\D/g, "").length !== 8 ||
      !String(input?.number ?? "").trim()
    )
      return;
    const parsed = addressSchema.safeParse(getValues("addressDetails"));
    if (!parsed.success) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLocating(true);
      try {
        const response = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
          signal: controller.signal,
        });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error(data.error);
        if (manuallyAdjusted.current) return;
        const suggestion = data.candidates[0];
        setPoint(suggestion);
        setValue("addressDetails.location", suggestion, {
          shouldDirty: true,
          shouldValidate: submitted.current,
        });
        setMapStatus(
          data.candidates.length
            ? "Localização aproximada encontrada. Confira o ponto e ajuste o marcador se necessário."
            : "Não encontramos este endereço. Clique no mapa para marcar o local.",
        );
      } catch (error) {
        if (!controller.signal.aborted)
          setMapStatus(
            error instanceof Error
              ? error.message
              : "Não foi possível buscar a localização.",
          );
      } finally {
        if (!controller.signal.aborted) setLocating(false);
      }
    }, 1200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [addressKey, getValues, setValue]);
  const changePoint = (next: LocationPoint) => {
    setPoint(next);
    manuallyAdjusted.current = true;
    setValue("addressDetails.location", next, {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    });
    setMapStatus(
      "Localização ajustada. A posição será salva ao criar o estabelecimento.",
    );
  };
  useEffect(() => {
    setStatus("");
    setLoading(false);
    if (cep.length !== 8) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (data.erro) {
          setStatus(
            "CEP não encontrado. Confira o número ou preencha o endereço manualmente.",
          );
          return;
        }
        for (const [field, key] of Object.entries({
          street: "logradouro",
          neighborhood: "bairro",
          city: "localidade",
          state: "uf",
        })) {
          setValue(
            `addressDetails.${field}`,
            typeof data[key] === "string" ? data[key] : "",
            {
              shouldDirty: true,
              shouldValidate: submitted.current,
            },
          );
        }
        setStatus(
          "Endereço encontrado. Confira os dados e informe o número e o complemento.",
        );
      } catch {
        if (!controller.signal.aborted)
          setStatus(
            "Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cep, setValue, getValues]);
  const fields = [
    ["postalCode", "CEP", "00000-000", "postal-code"],
    ["street", "Rua / avenida", "Nome do logradouro", "address-line1"],
    ["number", "Número", "123 ou S/N", "off"],
    ["complement", "Complemento", "Sala, andar, bloco…", "address-line2"],
    ["neighborhood", "Bairro", "Seu bairro", "address-level3"],
    ["city", "Cidade", "Sua cidade", "address-level2"],
    ["state", "UF", "SP", "address-level1"],
  ];
  return (
    <div className="mt-6">
      <div className="mb-5 flex items-start gap-3">
        <MapPin
          aria-hidden="true"
          size={20}
          className="mt-1 shrink-0 text-[#635BFF]"
        />
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            O endereço do seu espaço
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            O CEP preenche o endereço. O mapa só busca a localização depois que
            você informar também o número. Os campos de endereço marcados com *
            são obrigatórios ao cadastrar um local presencial; para atendimento
            exclusivamente online, deixe o endereço em branco.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(([field, label, placeholder, autoComplete]) => {
          const name = `addressDetails.${field}`;
          const nestedErrors = errors.addressDetails as
            Record<string, unknown> | undefined;
          return (
            <label
              key={field}
              className={`form-field ${field === "street" ? "sm:col-span-2" : ""}`}
            >
              <span>
                {label}
                {field !== "complement" && (
                  <span className="ml-1 text-red-600" aria-hidden="true">
                    *
                  </span>
                )}
              </span>
              <input
                {...register(name, {
                  onChange: (event) => {
                    if (field === "postalCode") {
                      const digits = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 8);
                      setValue(name, digits.replace(/^(\d{5})(\d)/, "$1-$2"));
                    }
                    if (field === "state")
                      setValue(
                        name,
                        event.target.value
                          .replace(/[^a-z]/gi, "")
                          .toUpperCase()
                          .slice(0, 2),
                      );
                  },
                })}
                placeholder={placeholder}
                required={addressStarted && field !== "complement"}
                aria-required={addressStarted && field !== "complement"}
                autoComplete={autoComplete}
                inputMode={field === "postalCode" ? "numeric" : "text"}
                maxLength={
                  field === "state"
                    ? 2
                    : field === "postalCode"
                      ? 9
                      : field === "number"
                        ? 20
                        : 150
                }
                aria-invalid={!!nestedErrors?.[field]}
                aria-describedby={
                  nestedErrors?.[field] ? `error-${name}` : undefined
                }
              />
              <FieldError name={name} />
            </label>
          );
        })}
      </div>
      <p
        role="status"
        className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-zinc-500"
      >
        {loading ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              size={14}
              className="animate-spin"
            />
            Buscando endereço…
          </>
        ) : (
          status
        )}
      </p>
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Confira a localização
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {addressIsComplete
                ? "Arraste o ponto ou clique no mapa para ajustar a localização. A posição será salva ao criar o estabelecimento."
                : "Informe o CEP e o número para localizar seu espaço. Se o local não tiver número, use S/N."}
            </p>
          </div>
        </div>
        <LocationMap
          point={point}
          onChange={changePoint}
          disabled={!addressIsComplete}
        />
        <p
          role="status"
          className="flex items-center gap-2 text-xs text-zinc-500"
        >
          {locating && (
            <LoaderCircle
              size={14}
              aria-hidden="true"
              className="animate-spin"
            />
          )}
          {locating ? "Localizando endereço…" : mapStatus}
        </p>
      </div>
    </div>
  );
}

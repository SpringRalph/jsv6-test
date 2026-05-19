import { z } from "zod/v4";

import { buildBasicAuthHeader, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
import consola from "consola";
import { NextResponse } from "next/server";

export const runtime = 'edge';

const PurchaseUnitSchema = z.object({
    amount: z.object({
        currency_code: z.string().length(3),
        value: z.string().optional(),
    }),
    payee: z
        .object({
            merchant_id: z.string().optional(),
        })
        .optional(),
});

const FindEligibleMethodsRequestSchema = z.object({
    customer: z
        .object({
            country_code: z.string().length(2).optional(),
        })
        .optional(),
    purchase_units: PurchaseUnitSchema.array().optional(),
    preferences: z
        .object({
            payment_flow: z
                .enum([
                    "ONE_TIME_PAYMENT",
                    "RECURRING_PAYMENT",
                    "VAULT_WITHOUT_PAYMENT",
                    "VAULT_WITH_PAYMENT",
                ])
                .optional(),
            payment_source_constraint: z
                .object({
                    constraint_type: z.enum(["INCLUDE", "EXCLUDE"]),
                    payment_sources: z.array(z.string()),
                })
                .optional(),
        })
        .optional(),
});

type FindEligibleMethodsRequest = z.infer<
    typeof FindEligibleMethodsRequestSchema
>;

// the presence of a payment_source in the response
// indicates that it is eligible
type FindEligibleMethodsSuccessResponse = {
    eligible_methods: {
        [payment_source: string]: {
            can_be_vaulted?: true;
        };
    };
};

type FindEligibleMethodsErrorResponse = {
    name: string;
    message: string;
    debug_id: string;
};

export async function POST({
    body,
    userAgent,
}: {
    body: FindEligibleMethodsRequest;
    userAgent?: string;
}) {
    const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
    consola.debug("------[1]------")
    const basic = buildBasicAuthHeader(clientId, clientSecret);

    const data = FindEligibleMethodsRequestSchema.parse(body);

    const response = await fetch(
        `${base}/v2/payments/find-eligible-methods`,
        {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
                "Accept-Language": "en_US",
                Authorization: basic,
                ...(userAgent && { "User-Agent": userAgent }),
            },
        },
    );

    const result = await response.json();
    consola.info(JSON.stringify(result, null, 2));



    if (!response.ok) {
        const { message } = result as FindEligibleMethodsErrorResponse;
        return NextResponse.json({
            message: message || "Failed to find eligible methods",
            statusCode: response.status,
            result,
        });
    }

    return NextResponse.json(result as FindEligibleMethodsSuccessResponse);
}

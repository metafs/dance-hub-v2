"use client";

import { useRef, useState, useSyncExternalStore } from "react";

import {
  ticketPriceTypes,
  type TicketOfferDraft,
  type TicketPriceType,
} from "@/features/revisions/schema";

const labels: Record<TicketPriceType, string> = {
  fixed: "固定価格",
  free: "無料",
  range: "価格範囲",
  donation: "カンパ制",
  pay_what_you_can: "Pay What You Can",
  sliding_scale: "Sliding Scale",
  dynamic: "Dynamic Pricing",
  included: "別料金・Pass等に含まれる",
};

const subscribeToHydration = () => () => undefined;

function value(value: string | number | null | undefined) {
  return value == null ? "" : String(value);
}

export function TicketOfferEditor({ initialOffers = [] }: { initialOffers?: TicketOfferDraft[] }) {
  const nextKey = useRef(initialOffers.length);
  const [offers, setOffers] = useState<TicketOfferDraft[]>(initialOffers);
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  function addOffer() {
    const key = `new-${nextKey.current++}`;
    setOffers((current) => [...current, { key, priceType: "fixed", currency: "JPY" }]);
  }

  function changeType(key: string, priceType: TicketPriceType) {
    setOffers((current) => current.map((offer) => offer.key === key ? { key, priceType, currency: ["fixed", "range", "sliding_scale"].includes(priceType) ? offer.currency || "JPY" : undefined, label: offer.label, notes: offer.notes } : offer));
  }

  return (
    <fieldset className="ticket-offer-editor">
      <legend>Ticket Offer（料金）</legend>
      <p className="field-help">Ticket Linkとは独立しています。金額は最小通貨単位で入力します（JPY 3,000円 = 3000、EUR 12.50 = 1250）。</p>
      {offers.map((offer, index) => {
        const prefix = `ticketOffer.${offer.key}`;
        const exactAmount = offer.priceType === "fixed" || offer.priceType === "sliding_scale";
        const rangeAmount = offer.priceType === "range";
        const optionalMinimum = offer.priceType === "pay_what_you_can";
        const hasCurrency = exactAmount || rangeAmount || optionalMinimum;
        return (
          <div className="ticket-offer-row" key={offer.key}>
            <input name="ticketOfferKey" type="hidden" value={offer.key} />
            <div className="review-card-header"><strong>料金 {index + 1}</strong><button className="button button-quiet" onClick={() => setOffers((current) => current.filter((candidate) => candidate.key !== offer.key))} type="button">削除</button></div>
            <label>料金タイプ<select name={`${prefix}.priceType`} onChange={(event) => changeType(offer.key, event.target.value as TicketPriceType)} value={offer.priceType}>{ticketPriceTypes.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label>
            <label>ラベル<input defaultValue={value(offer.label)} maxLength={120} name={`${prefix}.label`} placeholder="一般前売、U25、Accessなど" /></label>
            {hasCurrency ? <label>通貨コード<input defaultValue={value(offer.currency || "JPY")} maxLength={3} minLength={3} name={`${prefix}.currency`} pattern="[A-Za-z]{3}" placeholder="JPY" required={exactAmount || rangeAmount} /></label> : null}
            {exactAmount ? <label>金額（最小通貨単位）<input defaultValue={value(offer.amountMinor)} min="0" name={`${prefix}.amountMinor`} required step="1" type="number" /></label> : null}
            {rangeAmount ? <><label>最低金額（最小通貨単位）<input defaultValue={value(offer.minAmountMinor)} min="0" name={`${prefix}.minAmountMinor`} required step="1" type="number" /></label><label>最高金額（最小通貨単位）<input defaultValue={value(offer.maxAmountMinor)} min="0" name={`${prefix}.maxAmountMinor`} required step="1" type="number" /></label></> : null}
            {optionalMinimum ? <label>最低金額（任意・最小通貨単位）<input defaultValue={value(offer.minAmountMinor)} min="0" name={`${prefix}.minAmountMinor`} step="1" type="number" /></label> : null}
            <label>補足<textarea defaultValue={value(offer.notes)} name={`${prefix}.notes`} placeholder="対象条件、Pass名、価格変動についての説明など" rows={2} /></label>
          </div>
        );
      })}
      <button className="button button-secondary" disabled={!isHydrated} onClick={addOffer} type="button">料金を追加</button>
    </fieldset>
  );
}

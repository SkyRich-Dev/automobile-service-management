def get_gst_components(seller_gstin: str, buyer_gstin: str, gst_rate: float) -> dict:
    if not seller_gstin or len(seller_gstin) < 2:
        return {'cgst': gst_rate / 2, 'sgst': gst_rate / 2, 'igst': 0, 'type': 'INTRA'}

    seller_state = seller_gstin[:2]

    if not buyer_gstin or len(buyer_gstin) < 2:
        return {'cgst': gst_rate / 2, 'sgst': gst_rate / 2, 'igst': 0, 'type': 'INTRA'}

    buyer_state = buyer_gstin[:2]

    if seller_state == buyer_state:
        return {'cgst': gst_rate / 2, 'sgst': gst_rate / 2, 'igst': 0, 'type': 'INTRA'}
    else:
        return {'cgst': 0, 'sgst': 0, 'igst': gst_rate, 'type': 'INTER'}

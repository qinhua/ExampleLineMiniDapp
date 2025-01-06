import { NextRequest, NextResponse } from "next/server";
import {
  getGroupId,
  getGroupMembers,
  joinGroup,
} from "../../../hooks/backend/survey";
import { ethers } from "ethers";
import { get } from "react-hook-form";

interface JoinGroupData {
  id: string;
  commitment: bigint;
  signature: ethers.SignatureLike;
  idToken: string;
  account: string;
}

export async function GET(req: NextRequest) {
  try {
    const data = await req.json();
    const groupId = await getGroupId(data.id);
    const members = await getGroupMembers(groupId);
    return NextResponse.json(
      { data: JSON.stringify(members) },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: JSON.stringify(e) }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data: JoinGroupData = await req.json();

    console.log(1);
    const receipt = await joinGroup(
      data.id,
      BigInt(data.commitment),
      data.signature,
      data.idToken,
      data.account
    );
    console.log(receipt);
    return NextResponse.json(
      { data: JSON.stringify(receipt) },
      { status: 200 }
    );
  } catch (e) {
    console.log(JSON.stringify(e));
    return NextResponse.json({ error: JSON.stringify(e) }, { status: 400 });
  }
}

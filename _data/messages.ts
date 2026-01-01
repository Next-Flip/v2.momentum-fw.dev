export const branchMessages: Record<string, string> = {
    "kiisu-mntm":
        'This branch merges changes from <a href="https://github.com/kiisu-io/kiisu-firmware" target="_blank" rel="noopener noreferrer">Kiisu firmware</a> (a fork of OFW with modifications for the <a href="https://kiisu.io/" target="_blank" rel="noopener noreferrer">Kiisu board</a>) adapted for Momentum. This is unlikely to ever become official in Momentum releases and exists solely to provide builds for Kiisu board users - there is no intention to merge this PR.',
    "fix/patch-iso15693-crash":
        'Fixes the bug in issue <a href="https://github.com/Next-Flip/Momentum-Firmware/issues/417" target="_blank" rel="noopener noreferrer">NFC emulate ISO15693-3 Flipper crash and reboot #417</a> (hopefully)',
};

export function getBranchMessage(branchPR: string | undefined): string | null {
    if (!branchPR) return null;
    return branchMessages[branchPR] || null;
}

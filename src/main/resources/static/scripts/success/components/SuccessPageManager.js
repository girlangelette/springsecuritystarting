import SuccessPageConfigurer from "./SuccessPageConfigurer.js";
import SuccessPagePostRequestsExecutor from "./SuccessPagePostRequestsExecutor.js";
import SuccessPageDataResolver from "./SuccessPageDataResolver.js";
import CommonGetRequestsExecutor from "../../common/CommonGetRequestsExecutor.js";
import SuccessPageAdminPostRequestsExecutor from "./SuccessPageAdminPostRequestsExecutor.js";
import Verifier from "../../common/Verifier.js";
import {ALERT_WRONG_USERNAME_INPUT} from "../../common/Constants.js";

/**
 * A manager for <pre> success </pre> page.
 */
export default class SuccessPageManager {

    successPageConfigurer;
    successPagePostRequestExecutor;
    successPageDataResolver;
    commonGetRequestsExecutor;
    successPageAdminPostRequestExecutor;

    constructor() {
        this.successPageConfigurer = new SuccessPageConfigurer();
        this.successPagePostRequestExecutor = new SuccessPagePostRequestsExecutor();
        this.successPageDataResolver = new SuccessPageDataResolver();
        this.commonGetRequestsExecutor = new CommonGetRequestsExecutor();
        this.successPageAdminPostRequestExecutor = new SuccessPageAdminPostRequestsExecutor();
    }

    WRONG_ROW_DATA_INPUT = 'Something inputted wrong - time should be type of HH:MM and agenda should not be empty';

    /* A row's state before editing it(before clicking <pre> "edit" </pre> button). */
    rowDataBeforeUpdate;

    onEditButtonClicked(agendaId, editButton) {
        if ($(editButton).text().toLowerCase() === "edit") {
            /* Set state to <pre> rowDataBeforeUpdate </pre> before clicking <pre> "edit" </pre> button. */
            this.rowDataBeforeUpdate = this.successPageDataResolver
                .resolveDataFromNonContentEditableRowCorrespondingToSpecificButton(editButton);

            /* Do some page configurations after clicking <pre> "edit" </pre> button. */
            this.successPageConfigurer
                .configureOnEditButtonClicked(editButton);
        } else {
            /* Resolve row data after clicking <pre> "edit" </pre> button. */
            let newRowData = this.successPageDataResolver
                .resolveDataFromContentEditableRowCorrespondingToSpecificButton(editButton);

            /* Try to verify newly-inputted row data. */
            try {
                Verifier.verifyRowData(newRowData);
            } catch (e) {
                alert(this.WRONG_ROW_DATA_INPUT);
                /* set old data to row */
                this.successPageConfigurer.setRowData(editButton, this.rowDataBeforeUpdate);
                return;
            }

            /* In order to reduce the load on the server, we check, if a POST request really needed to be executed.
             * Of course, there is no need to execute a POST request if we didn't change agenda. */
            if (this.rowDataBeforeUpdate.equals(newRowData)) {
                alert('No update needed - you changed nothing!');
                this.successPageConfigurer.setRowData(editButton, newRowData);
                return;
            }

            /* if everything is fine, execute an update POST request. */
            this.successPagePostRequestExecutor
                .executeUpdateAgendaByItsIdPostRequest(agendaId, newRowData)
                /* If POST request proceeded normally, then...
                 * <pre> jqXHR </pre> is an analogue to ResponseEntity. */
                .done((jqXHR) => {
                        alert('Your agenda has been successfully updated.');
                        this.successPageConfigurer.setRowData(editButton, newRowData);
                    }
                )
                /* If POST request fails, then...
                 * <pre> jqXHR </pre> is an analogue to ResponseEntity. */
                .fail((jqXHR) => {
                        alert('An error occurred while updating your agenda.');
                        this.successPageConfigurer.setRowData(editButton, this.rowDataBeforeUpdate);
                    }
                );
        }
    }

    onDeleteButtonClicked(agendaId, deleteButton) {
        this.successPagePostRequestExecutor
            .executeDeleteAgendaByItsIdPostRequest(agendaId, deleteButton)
            /* If POST request proceeded normally, then...
             * <pre> jqXHR </pre> is an analogue to ResponseEntity. */
            .done((jqXHR) => {
                    alert('Your agenda has successfully been deleted.');
                    this.successPageConfigurer.deleteRowFromTable(deleteButton);
                }
            )
            /* If POST request fails, then...
             * <pre> jqXHR </pre> is an analogue to ResponseEntity. */
            .fail((jqXHR) => {
                    alert('An error occurred while deleting your agenda.');
                }
            )
    }

    onAddButtonClicked(username) {
        /* Add a new (pre-configured) row to the table. */
        const saveButtonInLastRow = this.successPageConfigurer.addRowToTable();

        /* Set a function to the <pre> "save" </pre> button -
         * it should execute a <pre> '/saveNewAgenda' </pre> post request. */
        saveButtonInLastRow.click(() => {
                /* Resolve row data from last row... */
                const rowData = this.successPageDataResolver
                    .resolveDataFromContentEditableRowCorrespondingToSpecificButton(saveButtonInLastRow);

                /* ...verify it... */
                try {
                    Verifier.verifyRowData(rowData);
                } catch (e) {
                    alert(this.WRONG_ROW_DATA_INPUT);
                    return;
                }

                /* ...if row data is verified, we can save it, so, we execute a
                 * <pre> '/saveNewAgenda' </pre> POST request. */
                this.successPagePostRequestExecutor
                    .executeSaveNewAgendaPostRequest(username, rowData)
                    /* If POST request proceeded normally, then...
                     * <pre> jqXHR </pre> is an analogue to ResponseEntity. */
                    .done((jqXHR) => {
                            alert('Your agenda has been successfully saved.');
                            this.successPageConfigurer
                                .afterSuccessfullySavingNewAgenda(saveButtonInLastRow, rowData);
                        }
                    )
                    /* If POST request fails, then...
                     * <pre> jqXHR </pre> is an analogue to ResponseEntity. */
                    .fail((jqXHR) => {
                            alert('An error occurred while saving your agenda.');
                        }
                    );
            }
        )
    }

    onSearchButtonClicked() {
        /* Resolve username for searching agenda... */
        const usernameForSearchingAgenda = this.successPageDataResolver
            .resolveUsernameForSearchingAgendas();

        /* ...try to verify it... */
        try {
            Verifier.verifyUsername(usernameForSearchingAgenda);
        } catch (e) {
            alert(ALERT_WRONG_USERNAME_INPUT);
            return;
        }

        /* ...if username is verified, the execute <pre>'/search'</pre> GET request. */
        this.commonGetRequestsExecutor
            .executeSearchSomeOnesAgendaGetRequest(usernameForSearchingAgenda);
    }

    onAdminBanButtonClicked() {
        /* Resolve username for banning... */
        const usernameForBanning = this.successPageDataResolver
            .resolveUsernameForBanningOrUnbanning();

        /* ...try to verify it... */
        try {
            Verifier.verifyUsername(usernameForBanning);
        } catch (e) {
            alert(ALERT_WRONG_USERNAME_INPUT);
            return;
        }

        /* ...if username is verified, the execute <pre> '/ban' </pre> <pre> POST </pre> request. */
        this.successPageAdminPostRequestExecutor
            .executeBanUserPostRequest(usernameForBanning)
            .done((jqXHR) => {
                    alert('User, having username: ' + usernameForBanning + ' has been successfully banned.');
                }
            )
            .fail((jqXHR) => {
                alert('An error occurred while banning a user.');
                }
            );

    }

    onAdminUnbanButtonClicked() {
        /* Resolve username for unbanning... */
        const usernameForUnbanning = this.successPageDataResolver
            .resolveUsernameForBanningOrUnbanning();

        /* ...try to verify it... */
        try {
            Verifier.verifyUsername(usernameForUnbanning);
        } catch (e) {
            alert(ALERT_WRONG_USERNAME_INPUT);
            return;
        }

        /* ...if username is verified, the execute <pre> '/unban' </pre> GET request. */
        this.successPageAdminPostRequestExecutor
            .executeUnbanUserPostRequest(usernameForUnbanning)
            .done((jqXHR) => {
                    alert('User, having username: ' + usernameForUnbanning + ' has been successfully unbanned.');
                }
            )
            .fail((jqXHR) => {
                    alert('An error occurred while unbanning a user.');
                }
            );
    }
}